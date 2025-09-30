from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
import os
import mimetypes
import shutil

# 라우터 생성
artifact_router = APIRouter(prefix="/api/artifacts", tags=["downloads"])

# 경로 설정
MODELS_PATH = Path("/app/models")
LOGS_PATH = Path("/app/train_logs")

def safe_file_access(root: Path, filename: str, allowed_extensions: set[str]) -> Path:
    """안전한 파일 접근을 위한 헬퍼 함수"""
    safe_filename = os.path.basename(filename)
    file_path = (root / safe_filename).resolve()
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_path.suffix.lower() not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    if root.resolve() not in file_path.parents:
        raise HTTPException(status_code=400, detail="Invalid path")
    
    return file_path

@artifact_router.get("/models/{file_name}")
async def download_model(file_name: str):
    """모델 다운로드"""
    try:
        file_path = safe_file_access(MODELS_PATH, file_name, {".zip"})

        media_type = mimetypes.guess_type(file_path.name)[0] or "application/zip"
        
        return FileResponse(
            path=str(file_path),
            media_type=media_type,
            filename=file_path.name
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error downloading model: {str(e)}")

@artifact_router.get("/train_logs/{file_name}")
async def download_train_logs(file_name: str):
    """학습 로그 다운로드"""
    try:
        base_name = file_name.rsplit('.', 1)[0]
        file_path = safe_file_access(LOGS_PATH / base_name, file_name, {".csv"})
        
        media_type = mimetypes.guess_type(file_path.name)[0] or "text/csv"
        
        return FileResponse(
            path=str(file_path),
            media_type=media_type,
            filename=file_path.name
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Error downloading logs: {str(e)}")

@artifact_router.get("/{run_name}/check-all")
async def check_run_artifacts(run_name: str):
    """특정 런의 모델과 로그 파일 존재 여부를 확인"""
    try:
        # 모델 파일 확인
        model_file = f"{run_name}.zip"
        model_path = MODELS_PATH / model_file
        model_exists = model_path.exists() and model_path.is_file()
        
        # 로그 파일 확인 (runName 폴더 안의 runName.csv)
        log_dir = LOGS_PATH / run_name
        log_file = log_dir / f"{run_name}.csv"
        log_exists = log_file.exists() and log_file.is_file()
        
        return {
            "run_name": run_name,
            "model": {
                "file_name": model_file,
                "exists": model_exists,
                "path": str(model_path) if model_exists else None
            },
            "log": {
                "file_name": f"{run_name}.csv",
                "exists": log_exists,
                "path": str(log_file) if log_exists else None
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking run artifacts: {str(e)}")

@artifact_router.delete("/delete")
async def delete_artifacts(request: dict):
    """실험 관련 아티팩트 삭제 (모델 파일과 로그 파일)"""
    try:
        run_name = request.get("run_name")
        
        if not run_name:
            raise HTTPException(status_code=400, detail="run_name is required")
        
        deleted_items = []
        
        # 모델 파일 삭제
        model_path = MODELS_PATH / f"{run_name}.zip"
        if model_path.exists() and model_path.is_file():
            model_path.unlink()
            deleted_items.append(f"model: {model_path.name}")
        
        # 로그 디렉토리 삭제
        log_path = LOGS_PATH / run_name
        if log_path.exists() and log_path.is_dir():
            shutil.rmtree(log_path)
            deleted_items.append(f"logs: {log_path.name}")
        
        if not deleted_items:
            return {"message": f"No artifacts found for {run_name}"}
        
        return {
            "message": f"Artifacts for {run_name} deleted successfully",
            "deleted_items": deleted_items
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete artifacts: {str(e)}")