from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import  train, algorithm, artifact

app = FastAPI(title="RL Experiment API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://0.0.0.0:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록

app.include_router(train.exp_router)
app.include_router(train.runs_router)
app.include_router(train.inference_router)
app.include_router(algorithm.algo_router)
app.include_router(algorithm.env_router)
app.include_router(artifact.artifact_router)

@app.get("/")
async def root():
    return {"message": "RL Experiment API"}

