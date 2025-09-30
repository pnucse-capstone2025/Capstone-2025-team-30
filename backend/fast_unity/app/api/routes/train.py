from fastapi import APIRouter, HTTPException, status
from app.services.unity_service import UnityService

from pydantic import BaseModel
from app.schemas.training import TrainRequest, TestRequest, SimSpeed

unity_service = UnityService()

exp_router = APIRouter(prefix="/experiment-templates", tags=["Experiments"])

@exp_router.post("/{experiment_id}/runs", status_code=status.HTTP_201_CREATED)
async def start_run(experiment_id: str,
               req: TrainRequest):
    
    result = await unity_service.start(req, experiment_id)
    return {"status": result}

runs_router = APIRouter(prefix="/runs", tags=["Runs"])



@runs_router.post("/{run_id}:pause")
async def pause_run(run_id: str):
    result = await unity_service.pause(run_id)
    return {"status": result}


@runs_router.post("/{run_id}:resume")
async def resume_run(run_id: str):
    result = await unity_service.resume(run_id)
    return {"status": result}

@runs_router.post("/{run_id}:stop")
async def stop_run(run_id: str):
    result = await unity_service.stop(run_id)
    return {"status": result}

@runs_router.post("/{run_id}:simSpeed")
async def set_speed(run_id :str,
            sim_speed : SimSpeed ):
    
    result = await unity_service.set_speed(run_id,sim_speed)
    return {"status": result}

class LLMFeedbackRequest(BaseModel):
    message: str

@runs_router.post("/{run_id}/feedback", status_code=status.HTTP_200_OK)
async def add_llm_feedback(run_id: str, req: LLMFeedbackRequest):
    """
    일시정지된 학습에 LLM 기반의 행동 지시를 전달합니다.
    """
    print(f"[UnityService] LLM 피드백 수신 (run_id: {run_id}): '{req.message}'")
    try:
        success = await unity_service.add_llm_feedback(run_id, req.message)
        if success:
            return {"message": "LLM 피드백이 성공적으로 처리되었습니다."}
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="LLM 피드백 처리 중 오류가 발생했습니다.")
    except RuntimeError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

inference_router = APIRouter(prefix="/inference", tags=["inference"])

@inference_router.post("/{run_id}")
async def run_inference(req : TestRequest, run_id :str):
    
    result = await unity_service.inference_model(req,run_id)
    return {"status": result}