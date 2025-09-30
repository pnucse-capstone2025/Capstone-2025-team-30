import subprocess
import asyncio
from functools import partial
import threading
from fastapi import APIRouter, BackgroundTasks
import json

from unity.train.train_runner import run_training,test_model
#from unity.train.test_model import test_model
#from rl.scripts.train_sb3_dqn import start_train
from app.schemas.training import TrainRequest, TestRequest, SimSpeed
from unity.train_util.training_state import UnityTrainingState, UnityInferenceState
from unity.train_util.sentiment_feedback_wrapper import SentimentLLMFeedback
from unity.train_util.sidechannel import RLSideChannel


class UnityService:
    def __init__(self):
        self.train_states = UnityTrainingState()
        self.inference_states = UnityInferenceState()
        # LLM 피드백 인스턴스를 run_id 별로 관리
        self.llm_feedback_handlers: dict[str, SentimentLLMFeedback] = {}
        self.side_channel = RLSideChannel()
        self.current_run_id :str = None
 
    def finish_train_callback(self):
        """학습 종료 시 호출되는 콜백. 관련 리소스를 정리합니다."""
        if self.current_run_id and self.current_run_id in self.llm_feedback_handlers:
            # 더 이상 사용하지 않는 LLM 핸들러를 메모리에서 제거
            del self.llm_feedback_handlers[self.current_run_id]
            print(f"[UnityService] LLM 핸들러를 정리했습니다 (run_id: {self.current_run_id})")

        # 현재 실행 중인 실험 상태 초기화
        self.current_run_id = None
        self.train_states.reset()
        print(f"[UnityService] 실험 상태 초기화 완료")
        
    # 학습 시작
    async def start(self, req: TrainRequest, exeriment_id :str):
        if self.train_states.is_running or self.current_run_id is not None:
            raise RuntimeError("다른 학습이 이미 실행 중입니다.")
        
        if self.inference_states.is_running:
            raise RuntimeError("모델 추론(테스트)이 실행 중이므로 학습을 시작할 수 없습니다.")

        def unpause_simulation():
            """LLM 피드백 처리 후 학습을 재개하는 콜백"""
            if self.train_states.is_paused:
                self.train_states.set_paused(False)

        # 새 학습을 위한 LLM 핸들러 생성 및 등록
        llm_handler = SentimentLLMFeedback(unpause_callback=unpause_simulation)
        self.llm_feedback_handlers[exeriment_id] = llm_handler
        self.current_run_id = exeriment_id
        
        
        self.train_states.is_running =True
        loop = asyncio.get_running_loop()
        
        task = partial(
        run_training,
        req, self.train_states, self.side_channel, self.current_run_id, self, llm_handler
        )
        loop.run_in_executor(None, task)
        
        
    # 유니티 빌드를 종료
    async def stop(self, exeriment_id :str):
        if self.current_run_id != exeriment_id:
            raise RuntimeError("요청한 ID와 일치하는 실행 중인 작업이 없습니다.")

        # 1. 학습 중지 처리
        if self.train_states.is_running or self.train_states.is_paused:
            self.train_states.is_stopped = True
            self.side_channel.send_command("stop", "")
            print("학습이 중지되었습니다.")
            # self.current_run_id는 finish_train_callback에서 정리됩니다.
            return "학습 중지 신호를 보냈습니다."
        # 2. 추론(테스트) 중지 처리
        elif self.inference_states.is_running:
            self.inference_states.set_stop(True) # 스레드 안전한 메서드 사용
            print("추론(테스트)이 중지되었습니다.")
            return "추론(테스트) 중지 신호를 보냈습니다."

        raise RuntimeError("중지할 작업(학습 또는 테스트)이 실행 중이 아닙니다.")

    # 유니티 빌드를 일시정지
    async def pause(self, exeriment_id :str):
        if self.current_run_id != exeriment_id:
            raise RuntimeError("요청한 ID와 일치하는 실행 중인 작업이 없습니다.")

        if self.train_states.is_running and not self.train_states.is_paused:
            self.train_states.set_paused(True)
            print("학습이 일시정지되었습니다.")
            return "학습을 일시정지했습니다."
        elif self.inference_states.is_running and not self.inference_states.is_paused:
            self.inference_states.set_paused(True)
            print("추론(테스트)이 일시정지되었습니다.")
            return "추론(테스트)을 일시정지했습니다."

        raise RuntimeError("일시정지할 작업이 없거나 이미 일시정지 상태입니다.")

    # 유니티 빌드를 재개
    async def resume(self,exeriment_id :str):
        if self.current_run_id != exeriment_id:
            raise RuntimeError("요청한 ID와 일치하는 실행 중인 작업이 없습니다.")

        if self.train_states.is_running and self.train_states.is_paused:
            self.train_states.set_paused(False)
            self.side_channel.send_command("resume", "")
            return "학습을 재개했습니다."
        elif self.inference_states.is_running and self.inference_states.is_paused:
            self.inference_states.set_paused(False)
            return "추론(테스트)을 재개했습니다."

        raise RuntimeError("재개할 작업이 없거나 이미 실행 중인 상태입니다.")

    async def set_speed(self, exeriment_id:str ,sim_speed:SimSpeed):
        if(self.current_run_id == exeriment_id):
            if self.train_states.is_running :
                msg_dict = sim_speed.model_dump()# 테스트 용.
                msg = {"simSpeed": sim_speed.sim_speed}
                msg = json.dumps(msg, ensure_ascii=False)
                self.side_channel.send_command("simSpeed",msg)

    # LLM 피드백 추가
    async def add_llm_feedback(self, run_id: str, message: str) -> bool:
        if run_id != self.current_run_id or not self.train_states.is_running:
            raise RuntimeError("피드백을 전달할 학습 세션이 실행 중이 아닙니다.")

        if not self.train_states.is_paused:
            raise RuntimeError("LLM 피드백은 학습이 '일시정지' 상태일 때만 가능합니다.")

        handler = self.llm_feedback_handlers.get(run_id)
        if not handler:
            raise RuntimeError("해당 학습 세션의 LLM 피드백 핸들러를 찾을 수 없습니다.")

        print(f"[UnityService] LLM 피드백 수신 (run_id: {run_id}): '{message}'")
        
        # 비동기로 LLM API 호출 실행
        loop = asyncio.get_running_loop()
        success = await loop.run_in_executor(None, handler.AddMessage, message)
        
        return success

#--------------------------------------
    #선택된 모델을 추론 평가 , 보상 정보등을 리턴해야하는데 ?
    async def inference_model(self, req :TestRequest, run_id: str):
        if self.inference_states.is_running:
            raise RuntimeError("다른 모델 추론(테스트)이 이미 실행 중입니다.")
        
        if self.train_states.is_running:
            raise RuntimeError("학습이 실행 중이므로 모델 추론(테스트)을 시작할 수 없습니다.")

        self.current_run_id = run_id
        self.inference_states.is_running = True
        loop = asyncio.get_running_loop()

        def task_wrapper():
            try:
                test_model(req, self.inference_states, self.side_channel,run_id)
            except Exception as e:
                print(f"[inference_model][ERROR] 추론 중 예외 발생: {e}")
            finally:
                # 추론이 성공적으로 끝나거나 예외로 종료될 때 상태를 초기화합니다.
                self.inference_states.is_running = False
                self.current_run_id = None # 현재 실행 ID 초기화
                print("추론(테스트)이 종료되었습니다.")

        loop.run_in_executor(None, task_wrapper)
        return "모델 추론(테스트)을 시작했습니다."