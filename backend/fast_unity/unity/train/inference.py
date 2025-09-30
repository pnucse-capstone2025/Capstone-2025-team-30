# 모델을 테스트 하는 구조의 메소드를 만들자
from app.schemas.training import  TestRequest
import gymnasium as gym
import numpy as np
from mlagents_envs.environment import UnityEnvironment
from mlagents_envs.base_env import ActionTuple
from stable_baselines3.common.base_class import BaseAlgorithm
from unity.train_util.gym_wrapper import MLAgentsGymWrapper
from unity.train.algo_registry import OG_ALGO_REGISTRY
from unity.train_util.custom_policy import DiffrentRLPolicy
from unity.train_util.custom_extractor import AdvancedCombinedExtractorMultipleVectors

def load_model(req: TestRequest, env : MLAgentsGymWrapper) ->BaseAlgorithm:
    algo = ALGOTRANS.get(req.algorithm, req.algorithm)
    algoClass =None
    print("---알고리즘")
    print(algo)
    try:
        algoClass = OG_ALGO_REGISTRY[algo]
    
    except:
        return
    model_path = "/app/models/"+ req.model_name + ".zip"
    custom_objects = {
        "policy": {
            "DiffrentRLPolicy": DiffrentRLPolicy,
        },
        "policy.features_extractor.class": AdvancedCombinedExtractorMultipleVectors,
    }
    # 커스텀 객체를 포함하여 모델 로드
    model = algoClass.load(path=model_path, env=env, custom_objects=custom_objects)
    return model
    
ALGOTRANS: dict[str,str] = {
    "tsc":"dqn",
    
}
