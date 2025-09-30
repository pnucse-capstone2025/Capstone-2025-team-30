import { Router, Request, Response } from "express";
import { RunModel } from "../models/Run";
import { 
  getRunsHandler, 
  getRunDetailHandler, 
  deleteRunHandler, 
  changeSimSpeedHandler
} from "./runs";
import { 
  validateId, 
  sendErrorResponse, 
  sendSuccessResponse, 
  asyncHandler, 
  logError, 
  logInfo 
} from "../utils/apiHelpers";

const router = Router();
const FASTAPI_BASE = process.env.FASTAPI_BASE || 'http://localhost:8000';

/**
 * 모델 테스트 시작
 * POST /api/models/:id/test
 */
const startModelTestHandler = async (req: Request, res: Response): Promise<void> => {
  const testModelId = validateId(req, res);
  if (!testModelId) return;

  const { episodesnum = 100000 } = req.body;

  try {
    // 테스트 모델 조회
    const testModel = await RunModel.findById(testModelId);
    if (!testModel) {
      sendErrorResponse(res, 404, "Test model not found");
      return;
    }

    // 상태를 TESTING으로 업데이트
    await RunModel.updateOne(
      { _id: testModelId },
      { $set: { testStatus: "TESTING" } }
    );

    const requestData = {
      model_name: testModel.runName,
      algorithm: testModel.algName,
      env_name: testModel.envName,
      episodesnum: episodesnum,
      envparams: testModel.envConfig || {},
    };

    logInfo("Model Test", "Starting test with data", requestData);

    // FastAPI로 테스트 요청 전송
    try {
      const response = await fetch(`${FASTAPI_BASE}/inference/${testModelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      logInfo("Model Test", "FastAPI test started successfully", responseData);

      sendSuccessResponse(res, {
        testStatus: "TESTING",
        modelId: testModelId,
        episodesnum: episodesnum
      }, "Test model started successfully");

    } catch (error) {
      logError("FastAPI Model Test", error);
      sendErrorResponse(res, 500, "Failed to communicate with FastAPI");
    }
  } catch (error) {
    logError("Model Test", error, { testModelId });
    sendErrorResponse(res, 500, "Failed to start model test");
  }
};

/**
 * 모델 테스트 일시정지
 * POST /api/models/:id/pause
 */
const pauseModelTestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: runId } = req.params;

    if (runId && !validateId(req, res)) {
      return;
    }

    // Run 존재 여부 확인
    const run = await RunModel.findById(runId).select("testStatus").lean();

    if (!run) {
      return sendErrorResponse(res, 404, "Run not found.");
    }

    // TESTING 상태에서만 일시정지 가능
    if (run.testStatus !== "TESTING") {
      return sendErrorResponse(res, 400, "Model test cannot be paused in current state.", {
        currentTestStatus: run.testStatus
      });
    }

    // FastAPI 호출
    try {
      const response = await fetch(`${FASTAPI_BASE}/runs/${runId}:pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      logInfo("Model Test Pause", "FastAPI model test paused successfully", { runId, data });

      // testStatus를 PAUSED로 업데이트
      await RunModel.updateOne(
        { _id: runId },
        { $set: { testStatus: "PAUSED" } }
      );

      logInfo("Model Test Pause", "Model test status updated to PAUSED", { runId });

      sendSuccessResponse(res, {
        runId: runId,
        testStatus: "PAUSED",
        message: "Model test paused successfully."
      });

    } catch (error) {
      logError("Model Test Pause", error);
      sendErrorResponse(res, 500, "Failed to pause model test via FastAPI");
    }

  } catch (error) {
    logError("Pause Model Test", error);
    sendErrorResponse(res, 500, "Failed to pause model test.");
  }
};

/**
 * 모델 테스트 재개
 * POST /api/models/:id/resume
 */
const resumeModelTestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: runId } = req.params;

    if (runId && !validateId(req, res)) {
      return;
    }

    // Run 존재 여부 확인
    const run = await RunModel.findById(runId).select("testStatus").lean();

    if (!run) {
      return sendErrorResponse(res, 404, "Run not found.");
    }

    // PAUSED 상태에서만 재개 가능
    if (run.testStatus !== "PAUSED") {
      return sendErrorResponse(res, 400, "Model test cannot be resumed in current state.", {
        currentTestStatus: run.testStatus
      });
    }

    // FastAPI 호출
    try {
      const response = await fetch(`${FASTAPI_BASE}/runs/${runId}:resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      logInfo("Model Test Resume", "FastAPI model test resumed successfully", { runId, data });

      // testStatus를 TESTING으로 업데이트
      await RunModel.updateOne(
        { _id: runId },
        { $set: { testStatus: "TESTING" } }
      );

      logInfo("Model Test Resume", "Model test status updated to TESTING", { runId });

      sendSuccessResponse(res, {
        runId: runId,
        testStatus: "TESTING",
        message: "Model test resumed successfully."
      });

    } catch (error) {
      logError("Model Test Resume", error);
      sendErrorResponse(res, 500, "Failed to resume model test via FastAPI");
    }

  } catch (error) {
    logError("Resume Model Test", error);
    sendErrorResponse(res, 500, "Failed to resume model test.");
  }
};

/**
 * 모델 테스트 종료
 */
const stopModelTestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: runId } = req.params;

    if (runId && !validateId(req, res)) {
      return;
    }

    // Run 존재 여부 확인
    const run = await RunModel.findById(runId).select("testStatus").lean();

    if (!run) {
      return sendErrorResponse(res, 404, "Run not found.");
    }

    // TESTING 또는 PAUSED 상태에서만 종료 가능
    if (!["TESTING", "PAUSED"].includes(run.testStatus)) {
      return sendErrorResponse(res, 400, "Model test cannot be stopped in current state.", {
        currentTestStatus: run.testStatus
      });
    }

    // FastAPI 호출
    try {
      const response = await fetch(`${FASTAPI_BASE}/runs/${runId}:stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      logInfo("Model Test Stop", "FastAPI model test stopped successfully", { runId, data });

      sendSuccessResponse(res, {
        runId: runId,
        message: "Model test stop request sent successfully. Status will be updated via callback."
      });

    } catch (error) {
      logError("Model Test Stop", error);
      sendErrorResponse(res, 500, "Failed to stop model test via FastAPI");
    }

  } catch (error) {
    logError("Stop Model Test", error);
    sendErrorResponse(res, 500, "Failed to stop model test.");
  }
};


/**
 * 모델 상태 조회
 * GET /api/models/:id/status
 */
const getModelStatusHandler = async (req: Request, res: Response): Promise<void> => {
  const modelId = validateId(req, res);
  if (!modelId) return;

  try {
    const model = await RunModel.findById(modelId).select("testStatus").lean();

    if (!model) {
      sendErrorResponse(res, 404, "Model not found");
      return;
    }

    sendSuccessResponse(res, {
      testStatus: model.testStatus
    });
  } catch (error) {
    logError("Get Model Status", error, { modelId });
    sendErrorResponse(res, 500, "Failed to get model status");
  }
};

// ===== 라우트 정의 =====

// 모델 목록 조회 (런 목록과 동일한 데이터)
router.get("/", getRunsHandler);

// 모델 상세 조회 (런 상세와 동일한 데이터)
router.get("/:id", getRunDetailHandler);

// 모델 삭제 (런 삭제와 동일한 로직)
router.delete("/:id", deleteRunHandler);

// 모델 상태 조회
router.get("/:id/status", asyncHandler(getModelStatusHandler));

// 모델 테스트 시작
router.post("/:id/test", asyncHandler(startModelTestHandler));

// 모델 테스트 제어 (모델 테스트 전용 핸들러 사용)
router.post("/:id/pause", asyncHandler(pauseModelTestHandler));
router.post("/:id/resume", asyncHandler(resumeModelTestHandler));
router.post("/:id/stop", asyncHandler(stopModelTestHandler));

// 모델 테스트 시뮬레이터 속도 변경
router.post("/:id/sim-speed", changeSimSpeedHandler);

export default router;