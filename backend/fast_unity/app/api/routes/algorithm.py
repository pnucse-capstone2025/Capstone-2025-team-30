from fastapi import APIRouter, HTTPException
from app.api.algorithm.algorithm_registry import ALGO_LIST, ALGO_SCHEMAS
from app.api.algorithm.environment_registry import ENV_LIST, ENV_SCHEMAS

algo_router = APIRouter(prefix="/algorithms", tags=["algorithms"])


@algo_router.get("")
async def get_algos():
    #알고리즘 리스트를 리턴한다.
    return {"algorithms": ALGO_LIST}

@algo_router.get("/{algorithm}")
async def get_algorithm(algorithm: str):
    # 알고리즘별 하이퍼 파리미터 구현하기
    return ALGO_SCHEMAS[algorithm]

env_router =APIRouter(prefix="/environments", tags=["environments"])

@env_router.get("")
async def get_envs():
    return {"environments" : ENV_LIST}

@env_router.get("/{environment}")
async def get_env_param(environment : str):
    return ENV_SCHEMAS[environment]
