from typing import Callable, Optional, Tuple, Union
import gymnasium as gym
import openai
import threading
import os
import json
import numpy as np

from collections import deque
def cnt_for_fb(fb: int, steps_since_warmup: int, total_remaining_steps: int) -> int:
    """'동적 카운트' 전략: 학습 진행도(스텝 기반)에 따라 피드백 강도를 조절"""
    if total_remaining_steps <= 0:
        return 1

    progress = min(1.0, steps_since_warmup / float(total_remaining_steps))

    if fb == 1:      # positive
        base_cnt = 4
        return max(1, int(base_cnt * (1 - progress * 0.5)))
    elif fb == 0:    # neutral
        return 1
    else:            # negative
        base_cnt = 3
        return max(1, int(base_cnt * (1 - progress * 0.3)))


action_map = {
    0: (0, -1,1),  1: (-1, 0,1),  2: (-1, 1,1),
    3: ( -1, -1,1),  4: ( 0, 0,1),  5: ( 0, 1,1),
    6: ( 1, -1,1),  7: ( 1, 0,1),  8: ( 1, 1,1),
    9: ( -1, 1,-1),  10: ( -1, 0,-1),  11: (-1,-1,-1),
    12: ( 0, 1,-1),  13: ( 0, 0,-1),  14: ( 0, -1,-1),
    15: ( 1, 1,-1),  16: ( 1, 0,-1),  17: ( 1, -1,-1)
}
def to_feedback(dist):
    if dist < 0.4:      return  1  # 긍정 (0.0 ~ 0.3)
    elif dist < 0.7:    return  0  # 중립 (0.4 ~ 0.6)
    else:               return -1  # 부정 (0.7 ~ 1.0)

action_descriptions = {
    0: "직진하며 살짝 감속합니다.",
    1: "왼쪽으로 돌며 속도를 유지합니다.",
    2: "왼쪽으로 돌며 가속합니다.",
    3: "왼쪽으로 돌며 살짝 감속합니다.",
    4: "직진하며 현재 속도를 유지합니다.",
    5: "직진하며 가속합니다.",
    6: "오른쪽으로 돌며 살짝 감속합니다.",
    7: "오른쪽으로 돌며 속도를 유지합니다.",
    8: "오른쪽으로 돌며 가속합니다.",
    9: "왼쪽으로 돌며 브레이크를 살짝 풉니다.",
    10: "왼쪽으로 돌며 제동 상태를 유지합니다.",
    11: "왼쪽으로 돌며 강하게 제동합니다.",
    12: "직진하며 브레이크를 살짝 풉니다.",
    13: "직진하며 제동 상태를 유지합니다.",
    14: "직진하며 강하게 제동합니다.",
    15: "오른쪽으로 돌며 브레이크를 살짝 풉니다.",
    16: "오른쪽으로 돌며 제동 상태를 유지합니다.",
    17: "오른쪽으로 돌며 강하게 제동합니다."
}

class SentimentLLMFeedback:
    """
    LLM을 통해 사용자의 텍스트 피드백을 감성(긍정/중립/부정)으로 분석하고,
    피드백 값(-1, 0, 1)으로 변환하는 클래스.
    """
    _lock: "threading.Lock"

    def __init__(self, unpause_callback: Optional[Callable] = None):
        self.client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        self.system_prompt = """
        당신은 강화학습 에이전트의 행동과 그에 대한 사용자 피드백을 분석하는 시스템입니다.
        주어진 피드백이 에이전트의 행동에 대해 얼마나 부정적인지를 [0.0, 1.0] 사이의 연속적인 값으로 평가해주세요.
        - 0.0: 매우 긍정적 (올바른 행동)
        - 0.1 ~ 0.3: 다소 긍정적
        - 0.4 ~ 0.6: 중립적이거나 불분명함
        - 0.7 ~ 0.9: 다소 부정적 (약간의 실수)
        - 1.0: 매우 부정적이거나 위험함 (큰 실수, 충돌 등)
        
        다른 설명 없이 {"feedback": [결과 값]} 형태의 JSON으로만 반환하시오.
        결과 값은 0.0과 1.0 사이의 실수(float)여야 합니다.
        """
        self._message_queue = deque(maxlen=1) # 최신 메시지 하나만 저장
        self._lock = threading.Lock()
        self.unpause_callback = unpause_callback

    def AddMessage(self, message: str) -> bool:
        """
        사용자 메시지를 받아 큐에 저장하고, 학습 재개 콜백을 호출합니다.
        """
        with self._lock:
            self._message_queue.append(message)
        
        # 메시지 수신 후 unpause 콜백 호출
        if self.unpause_callback:
            self.unpause_callback()
        
        return True

    def consume_message_and_get_feedback(self, action_message: str) -> Optional[int]:
        """
        사용자 메시지를 받아 LLM API를 호출하고, 결과로 나온 피드백 값을 내부에 저장합니다.
        """
        message: Optional[str] = None
        with self._lock:
            if len(self._message_queue) > 0:
                message = self._message_queue.popleft()
        if message is None:
            return None
        full_prompt = (
            f"에이전트가 방금 '{action_message}' 행동을 했습니다.\n"
            f"이에 대한 사용자 피드백은 다음과 같습니다: '{message}'"
        )
        try:
            completion = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": full_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
            )
            content = completion.choices[0].message.content
            response_data = json.loads(content)
            feedback_score = float(response_data["feedback"])

            if not (0.0 <= feedback_score <= 1.0):
                raise ValueError("피드백 점수는 0.0과 1.0 사이여야 합니다.")

            feedback_value = to_feedback(feedback_score)
            print(f"LLM 피드백 수신 및 처리 완료: {feedback_value}")
            return feedback_value
        except (openai.APIError, ValueError, IndexError, json.JSONDecodeError, KeyError) as e:
            print(f"[SentimentLLMFeedback] API 호출 또는 응답 처리 중 오류 발생: {e}")
            return None


class SentimentLLMWrapper(gym.Wrapper):
    """
    LLM의 감성 분석 결과를 보상 셰이핑에 사용하는 래퍼.

    - 사용자의 텍스트 입력을 LLM으로 보내 긍정(1), 중립(0), 부정(-1) 피드백을 받습니다.
    - 이 피드백을 바탕으로 보상을 조절하고, 관련 정보를 info 딕셔너리에 추가합니다.
    - 기존 teacher 모델 없이 LLM 피드백에만 의존합니다.
    """
    def __init__(
        self,
        env: gym.Env,
        message_handler: SentimentLLMFeedback,
        total_timesteps: int = 1_000_000,
        feedback_weight: float = 0.05,
        warmup_fraction: float = 0.05,
        verbose: int = 1,
    ):
        super().__init__(env)
        self.message_handler = message_handler
        self.total_timesteps = total_timesteps
        self.feedback_weight = float(feedback_weight)
        self.warmup_end_step = int(total_timesteps * warmup_fraction)
        self.verbose = int(verbose)

        # 내부 상태
        self._episode_idx = 0
        self._total_step = 0
        
        # 통계
        self._fb_pos = 0
        self._fb_neu = 0
        self._fb_neg = 0


    def reset(self, *, seed=None, options=None):
        if self._episode_idx > 0 and self.verbose > 0:
            print(f"[SentimentLLM] Ep{self._episode_idx:04d} FB(+ {self._fb_pos} / 0 {self._fb_neu} / - {self._fb_neg})")
        self._fb_pos = self._fb_neu = self._fb_neg = 0

        obs, info = self.env.reset(seed=seed, options=options)
        return obs, info

    def step(self, action):
        self._total_step += 1

        fb = 0
        cnt = 1
        shaped = 0.0
        is_warmup = self._total_step < self.warmup_end_step

        # 현재 action에 대한 설명을 가져와서, 대기 중인 메시지가 있다면 LLM 피드백을 요청합니다.
        action_idx = int(action) if not isinstance(action, int) else action
        action_description = action_descriptions.get(action_idx, "알 수 없는 행동")
        llm_feedback = self.message_handler.consume_message_and_get_feedback(action_description)

        if llm_feedback is not None and not is_warmup:
            fb = llm_feedback

            # 보상 셰이핑 (학습 진행도에 따라 가중치 감소)
            progress = self._total_step / self.total_timesteps
            shaped = self.feedback_weight * float(fb) * (1 - progress)

            # 동적 카운트 계산
            steps_since_warmup = max(0, self._total_step - self.warmup_end_step)
            total_remaining_steps = max(1, self.total_timesteps - self._total_step)
            cnt = cnt_for_fb(fb, steps_since_warmup, total_remaining_steps)

            # 통계 업데이트
            if fb > 0:
                self._fb_pos += 1
            elif fb < 0:
                self._fb_neg += 1
            else:
                self._fb_neu += 1

        # 환경 스텝 진행 및 보상 적용
        next_obs, reward, terminated, truncated, info = self.env.step(action)
        reward = float(reward) + shaped

        if terminated or truncated:
            self._episode_idx += 1

        # info 딕셔너리 확장
        info = dict(info) if info is not None else {}
        info.update({
            "tfw_feedback": fb,
            "tfw_shaped_reward": shaped,
            "tfw_is_warmup": is_warmup,
            "tfw_cnt": int(cnt),
        })
        return next_obs, reward, terminated, truncated, info
