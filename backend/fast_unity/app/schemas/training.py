from pydantic import BaseModel,Field
from typing import Literal, Optional, Dict, Any
from datetime import datetime



    
# 재 정리한 스키마
#--------------------------------------------------------




class TrainRequest(BaseModel):
    model_name:str
    algorithm: Literal["ppo", "a2c", "dqn", "sac", "tsc", "hf-llm", "srl"]
    env_name : str
    total_timesteps: int = Field(..., gt=0)
    hyperparams: Dict[str, Any] = {}  # SB3 하이퍼파라미터 통째로
    envparams : Dict[str,Any]={}

class TestRequest(BaseModel):
    model_name:str
    algorithm: Literal["ppo", "a2c", "dqn", "sac", "tsc", "hf-llm", "srl"]
    env_name: str
    episodesnum : int
    envparams: Dict[str,Any]={}
    
class SimSpeed(BaseModel):
    sim_speed:float