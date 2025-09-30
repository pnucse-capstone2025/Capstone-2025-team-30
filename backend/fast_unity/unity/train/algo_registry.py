import inspect
from typing import Dict, Any
from stable_baselines3 import PPO, A2C, DQN, SAC
from stable_baselines3.common.base_class import BaseAlgorithm
import gymnasium as gym
from app.schemas.training import TrainRequest
from unity.train_util.feedback_wrapper import TeacherFeedbackWrapper
from unity.train_util.sentiment_feedback_wrapper import SentimentLLMFeedback, SentimentLLMWrapper 
from unity.train_util.gym_wrapper import MLAgentsGymWrapper
from unity.train_util.dup_replay_buffer import DupReplayBuffer
from unity.train_util.dup_dict_replay_buffer import DupDictReplayBuffer 

from unity.train_util.custom_extractor import AdvancedCombinedExtractorMultipleVectors
from unity.train_util.custom_policy import DiffrentRLPolicy
from typing import Literal, Optional

def filter_kwargs(ctor, hp: Dict[str, Any], exclude: set = None) -> Dict[str, Any]:
    """
    알고리즘 생성자 시그니처에 맞는 키만 통과시켜 잘못된 키워드 인자 오류를 방지합니다.
    exclude 집합에 포함된 키는 필터링에서 제외합니다.
    """
    sig = inspect.signature(ctor)
    hp = hp or {}
    exclude = exclude or set()
    return {k: v for k, v in hp.items() if k in sig.parameters and k not in exclude}

# 모델 생성 시 하이퍼파라미터(hp)에 의해 덮어쓰여지면 안 되는 키워드 인자들의 공통 집합
# 이 키들은 build 메소드 내에서 명시적으로 관리됩니다.
COMMON_EXCLUDE_KEYS = {
    "policy",
    "env",
    "verbose",
    "seed",
    "device",
    "replay_buffer_class",
    "replay_buffer_kwargs",
    "policy_kwargs"
}
class AlgoAdapter:
    ALG: str = "base"
    CLS = None  # SB3 클래스
    def policy_set(self, req :TrainRequest):
        if req.env_name =="cnn_car":
            policy = "MultiInputPolicy"
        else :
            policy = "MlpPolicy"
        return policy
    def build(self,req: TrainRequest,  env:MLAgentsGymWrapper, hp: Dict[str, Any]= None) -> BaseAlgorithm:
        policy_kwargs = dict(
        features_extractor_class=AdvancedCombinedExtractorMultipleVectors,
        features_extractor_kwargs=dict(cnn_output_dim=128),
        net_arch=[256, 128]
        )
        policy = self.policy_set(req)
        
        kwargs = filter_kwargs(self.CLS.__init__, hp, exclude=COMMON_EXCLUDE_KEYS)

        if(req.env_name =="cnn_car"):
            return self.CLS(policy = policy, env=env, **kwargs,device = "auto",policy_kwargs=policy_kwargs, verbose=1)
        
        return self.CLS(policy = policy, env=env, **kwargs,device = "auto", verbose=1) 
    def learn(self, model: BaseAlgorithm, total_timesteps: int, callback=None):
        return model.learn(total_timesteps=total_timesteps, callback=callback)
    
    def _load_teacher_model(self, hp: Dict[str, Any], env: MLAgentsGymWrapper) -> Optional[BaseAlgorithm]:
        """하이퍼파라미터에서 teacher 모델 정보를 읽어 로드합니다."""
        teacher_name = hp.get("teacher_name")
        teacher_algo_name = hp.get("teacher_algo")
        
        if not teacher_name or not teacher_algo_name:
            return None
        teacher_algo_class = OG_ALGO_REGISTRY.get(teacher_algo_name)
        return load_model(teacher_name, teacher_algo_class, env) if teacher_algo_class else None
    
 

class OnPolicyAdapter(AlgoAdapter):
    pass  

class OffPolicyAdapter(AlgoAdapter):
    
    pass
class SACBinningAdapter(OffPolicyAdapter):
    ALG = "sac"
    CLS = SAC

    def build(self, req: TrainRequest, env: MLAgentsGymWrapper, hp: Dict[str, Any] = None) -> BaseAlgorithm:
        # 1) SAC는 Box 액션만 지원
        if not isinstance(env.action_space, gym.spaces.Box):
            raise AssertionError(
                "SAC는 연속형(Box) 액션이 필요합니다. MLAgentsGymWrapper를 act_mode='binning'으로 생성해 주세요."
            )

        # 2) 정책 선택
        policy = self.policy_set(req)

        # 3) cnn_car인 경우 커스텀 extractor/policy kwargs 적용
        policy_kwargs = None
        if req.env_name == "cnn_car":
            policy_kwargs = dict(
                features_extractor_class=AdvancedCombinedExtractorMultipleVectors,
                features_extractor_kwargs=dict(cnn_output_dim=128),
                net_arch=[256, 128],
            )

        # 4) 하이퍼파라미터 필터링
        kwargs = filter_kwargs(self.CLS.__init__, hp, exclude=COMMON_EXCLUDE_KEYS)

        # 5) 모델 생성 (SAC는 자체 리플레이 버퍼 사용)
        model = self.CLS(
            policy=policy,
            env=env,
            device="auto",
            verbose=1,
            **({"policy_kwargs": policy_kwargs} if policy_kwargs else {}),
            **kwargs,
        )
        return model  

class TeacherStudentCosAdapter(AlgoAdapter):
   
    def build(self, req:TrainRequest, env: MLAgentsGymWrapper, hp: Dict[str,Any])-> BaseAlgorithm:
        wrapped_env: gym.Env
        policy = self.policy_set(req)
        
        teacher_model = self._load_teacher_model(hp, env)
        if not teacher_model:
            raise ValueError("tsc 알고리즘은 teacher 모델이 필요합니다.")
        
        # TeacherFeedbackWrapper로 환경 래핑
        wrapped_env = TeacherFeedbackWrapper(
            env=env,
            total_timesteps=req.total_timesteps,
            teacher=teacher_model,
            **filter_kwargs(TeacherFeedbackWrapper.__init__, hp)
        )
        
        replay_buffer = DupDictReplayBuffer if req.env_name == "cnn_car" else DupReplayBuffer
        
        # 명시적으로 설정된 인자들이 hp에 의해 덮어쓰여지는 것을 방지
        kwargs = filter_kwargs(self.CLS.__init__, hp, exclude=COMMON_EXCLUDE_KEYS)

        model = self.CLS(
            policy=policy,
            env=wrapped_env,
            **kwargs,
            verbose=1,
            #tensorboard_log="runs/sb3_dqn_unity",
            seed=42,
            device="auto",
            replay_buffer_class=replay_buffer,          # ← 동적 중복 반영
            replay_buffer_kwargs=dict(handle_timeout_termination=True), 
        )
        return model   

class SeparateRLAdapter(AlgoAdapter):
    def build(self, req: TrainRequest, env: MLAgentsGymWrapper, hp: Dict[str, Any]) -> BaseAlgorithm:
     

        if req.env_name != "cnn_car":
            raise ValueError("SRL 알고리즘은 'cnn_car' 환경에서만 사용할 수 있습니다.")

        # 1. 교사 모델 로드
        teacher_model = self._load_teacher_model(hp, env)
        if not teacher_model:
            raise ValueError("이 알고리즘은 특징 추출기 가중치를 복사할 teacher 모델이 필요합니다.")

        # 2. 커스텀 정책 및 특징 추출기 설정
        policy_kwargs = dict(
        features_extractor_class=AdvancedCombinedExtractorMultipleVectors,
        features_extractor_kwargs=dict(cnn_output_dim=128),
        net_arch=[256, 128]
        )


        # 3. 모델 생성 (분리된 학습률을 사용하는 DiffrentRLPolicy 사용)
        # 명시적으로 설정된 인자들이 hp에 의해 덮어쓰여지는 것을 방지
        kwargs = filter_kwargs(self.CLS.__init__, hp, exclude=COMMON_EXCLUDE_KEYS)
        student_model = self.CLS(
            policy=DiffrentRLPolicy,
            env=env,
            policy_kwargs=policy_kwargs,
            replay_buffer_class=DupDictReplayBuffer,
            replay_buffer_kwargs=dict(handle_timeout_termination=True),
            verbose=1,
            **kwargs,
        )

        # 4. 교사의 특징 추출기 가중치를 현재 모델에 복사
      
        teacher_fe_state_dict = teacher_model.policy.q_net.features_extractor.state_dict()
        student_model.policy.q_net.features_extractor.load_state_dict(teacher_fe_state_dict)
        
        print("[SeparateRLAdapter] 교사 모델의 특징 추출기 가중치를 현재 모델로 복사했습니다.")

        return student_model

class SentimentLLMAdapter(SeparateRLAdapter):
    def build(self, req:TrainRequest, env: MLAgentsGymWrapper, hp: Dict[str,Any], llm_handler: Optional[SentimentLLMFeedback]) -> BaseAlgorithm:
        # SRL의 특징 추출기 복사 기능과 LLM 감성 피드백을 결합한 어댑터
        if req.env_name != "cnn_car":
            raise ValueError("이 알고리즘은 'cnn_car' 환경에서만 사용할 수 있습니다.")

        if not llm_handler:
            raise ValueError("이 알고리즘은 LLM 핸들러가 필요합니다.")

        # 1. 교사 모델 로드 (특징 추출기 복사용)
        teacher_model = self._load_teacher_model(hp, env)
        if not teacher_model:
            raise ValueError("이 알고리즘은 특징 추출기 가중치를 복사할 teacher 모델이 필요합니다.")

        # 2. SentimentLLMWrapper로 환경 래핑
        wrapped_env = SentimentLLMWrapper(
            env=env,
            total_timesteps=req.total_timesteps,
            message_handler=llm_handler,
            **filter_kwargs(SentimentLLMWrapper.__init__, hp)
        )

        # 3. 커스텀 정책 및 특징 추출기 설정
        policy_kwargs = dict(
        features_extractor_class=AdvancedCombinedExtractorMultipleVectors,
        features_extractor_kwargs=dict(cnn_output_dim=128),
        net_arch=[256, 128]
        )


        # 4. 모델 생성 (래핑된 환경과 커스텀 정책 사용)
        kwargs = filter_kwargs(self.CLS.__init__, hp, exclude=COMMON_EXCLUDE_KEYS)
        student_model = self.CLS(
            policy=DiffrentRLPolicy,
            env=wrapped_env,
            policy_kwargs=policy_kwargs,
            replay_buffer_class=DupDictReplayBuffer,
            replay_buffer_kwargs=dict(handle_timeout_termination=True),
            verbose=1,
            **kwargs,
        )

        # 5. 교사의 특징 추출기 가중치를 현재 모델에 복사
        teacher_fe_state_dict = teacher_model.policy.q_net.features_extractor.state_dict()
        student_model.policy.q_net.features_extractor.load_state_dict(teacher_fe_state_dict)
        print("[SentimentLLMAdapter] 교사 모델의 특징 추출기 가중치를 학생 모델로 복사했습니다.")

        return student_model

    
ALGORITHM_REGISTRY = {
    "ppo":  type("PPOAdapter",(OnPolicyAdapter,), {"ALG":"ppo","CLS":PPO})(),
    "a2c":  type("A2CAdapter",(OnPolicyAdapter,), {"ALG":"a2c","CLS":A2C})(),
    "dqn":  type("DQNAdapter",(OffPolicyAdapter,), {"ALG":"dqn","CLS":DQN})(),
    "sac":  SACBinningAdapter(),
    "tsc":  type("TSCosAdapter",(TeacherStudentCosAdapter,), {"ALG":"tsc","CLS":DQN})(),
    "hf-llm": type("HfLlmAdapter", (SentimentLLMAdapter,), {"ALG": "hf-llm", "CLS": DQN})(),
    "srl":  type("SRLAdapter",(SeparateRLAdapter,), {"ALG":"srl","CLS":DQN})(),
}
OG_ALGO_REGISTRY: dict[str, type[BaseAlgorithm]] = {
    "dqn": DQN,
    "tsc": DQN,
    "ppo": PPO,
    "a2c": A2C,
    "sac": SAC,
    "hf-llm": DQN,
    
    "srl": DQN,
}
def load_model(model_name:str, model_algo: BaseAlgorithm, env: MLAgentsGymWrapper):
    model_path = "models/"+ model_name
    # 모델 로드 시 커스텀 클래스를 찾을 수 있도록 custom_objects를 전달합니다.
    # 이는 저장된 모델이 커스텀 정책이나 특징 추출기를 사용할 때 필요합니다.
    custom_objects = {
        "policy_kwargs": dict(
            features_extractor_class=AdvancedCombinedExtractorMultipleVectors,
            features_extractor_kwargs=dict(cnn_output_dim=128),
            net_arch=[256, 128]
        ),
        "policy_class": DiffrentRLPolicy,
    }
    return model_algo.load(model_path, env=env, custom_objects=custom_objects)