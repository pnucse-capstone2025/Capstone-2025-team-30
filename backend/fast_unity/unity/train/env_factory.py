import os
import json
from typing import Tuple, Optional
from pathlib import Path
from stable_baselines3.common.monitor import Monitor
#from stable_baselines3.common.logger import configure
from app.schemas.training import TrainRequest,TestRequest

import gymnasium as gym
from unity.train_util.gym_wrapper import MLAgentsGymWrapper
from unity.train_util.sidechannel import RLSideChannel

from unity.train_util.training_state import UnityInferenceState




        
def make_env(req: TrainRequest, side_channel : RLSideChannel=None) ->MLAgentsGymWrapper:
    
    # 사이드 채널을 이용하여 파라미터 보내자
    
    env_path = "unity/envs/"+ req.env_name +"/env.x86_64"
    use_dict_obs = False
    act_mode = "discrete"
    if req.algorithm == "sac":
        act_mode = "binning"    
    if req.env_name == "cnn_car":
        use_dict_obs = True
    env = MLAgentsGymWrapper(unity_env_path = env_path,side_channels=side_channel, use_dict_obs = use_dict_obs, act_mode=act_mode)
    if env==None:
        raise RuntimeError("환경이 생성되지 못하였습니다")
    if  not side_channel == []:
        env= Monitor(env)
    msg = json.dumps(req.envparams, ensure_ascii=False)
    side_channel.send_command("init",msg )
    return env

def make_env_inference(req : TestRequest, side_channel: RLSideChannel=[])-> MLAgentsGymWrapper:
    
    env_path = "unity/envs/"+ req.env_name +"/env.x86_64"
    
    use_dict_obs = False
    act_mode = "discrete"
    if req.algorithm == "sac":
        act_mode = "binning"
    if req.env_name == "cnn_car":
        use_dict_obs = True
    env = MLAgentsGymWrapper(env_path, side_channels=side_channel, use_dict_obs=use_dict_obs, act_mode=act_mode)
    if env==None:
        raise RuntimeError("환경이 생성되지 못하였습니다")
    if  not side_channel == []:
        env= Monitor(env)
    msg = json.dumps(req.envparams, ensure_ascii=False)
    side_channel.send_command("init",msg )
    return env