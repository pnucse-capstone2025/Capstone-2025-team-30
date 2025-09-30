import { Router, Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import axios from 'axios';
import { 
  logInfo, 
  logError, 
  sendSuccessResponse, 
  sendErrorResponse, 
  asyncHandler 
} from '../utils/apiHelpers';

const router = Router();
const FASTAPI_BASE = process.env.FASTAPI_BASE || 'http://localhost:8000';

// FastAPI에 삭제 요청을 보내는 함수
export const deleteArtifacts = async (runName: string): Promise<{ success: boolean; message: string }> => {
  try {
    logInfo("Delete Artifacts", "Sending delete request to FastAPI", { runName });
    
    // FastAPI의 삭제 엔드포인트 호출
    const response = await axios.delete(`${FASTAPI_BASE}/api/artifacts/delete`, {
      data: { run_name: runName },
      timeout: 10000 // 10초 타임아웃
    });

    logInfo("Delete Artifacts", "FastAPI delete request successful", { 
      runName, 
      message: response.data.message 
    });

    return {
      success: true,
      message: response.data.message || 'Artifacts deleted successfully'
    };
  } catch (error: any) {
    logError("Delete Artifacts", error, { runName });
    
    // FastAPI 서버가 응답하지 않는 경우도 성공으로 처리 (파일이 없을 수 있음)
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logInfo("Delete Artifacts", "FastAPI server unavailable, assuming deletion successful", { runName });
      return {
        success: true,
        message: 'FastAPI server unavailable, but deletion assumed successful'
      };
    }

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Failed to delete artifacts'
    };
  }
};

/**
 * 파일 존재 여부 확인
 * GET /api/artifacts/:runName/check
 */
const checkArtifactsHandler = async (req: Request, res: Response): Promise<void> => {
  const { runName } = req.params;
  
  if (!runName) {
    sendErrorResponse(res, 400, 'Run name is required');
    return;
  }

  try {
    const response = await axios.get(`${FASTAPI_BASE}/api/artifacts/${runName}/check-all`, {
      timeout: 5000
    });

    logInfo("Check Artifacts", "Successfully checked artifacts", { runName, data: response.data });
    sendSuccessResponse(res, response.data);
  } catch (error: any) {
    logError("Check Artifacts", error, { runName });
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      sendErrorResponse(res, 503, 'FastAPI server unavailable');
    } else if (error.response?.status === 404) {
      sendErrorResponse(res, 404, 'Run not found');
    } else {
      sendErrorResponse(res, 500, 'Failed to check artifacts');
    }
  }
};

/**
 * 모델 다운로드 (파일 존재 여부 확인 후)
 * GET /api/artifacts/models/:filename
 */
const downloadModelHandler = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;
  
  if (!filename) {
    sendErrorResponse(res, 400, 'Filename is required');
    return;
  }

  // 파일명에서 runName 추출 (filename.zip -> filename)
  const runName = filename.replace(/\.zip$/, '');

  try {
    // 1. 파일 존재 여부 확인
    const checkResponse = await axios.get(`${FASTAPI_BASE}/api/artifacts/${runName}/check-all`, {
      timeout: 5000
    });

    if (!checkResponse.data.model?.exists) {
      logInfo("Download Model", "Model file not found", { runName, filename });
      sendErrorResponse(res, 404, 'Model file not found');
      return;
    }

    // 2. 파일 다운로드 스트림
    const downloadResponse = await axios.get(`${FASTAPI_BASE}/api/artifacts/models/${filename}`, {
      responseType: 'stream',
      timeout: 30000 // 30초 타임아웃
    });

    // 3. 응답 헤더 설정
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // 4. 스트림 파이프
    downloadResponse.data.pipe(res);
    
    logInfo("Download Model", "Model download started", { runName, filename });
  } catch (error: any) {
    logError("Download Model", error, { runName, filename });
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      sendErrorResponse(res, 503, 'FastAPI server unavailable');
    } else if (error.response?.status === 404) {
      sendErrorResponse(res, 404, 'Model file not found');
    } else {
      sendErrorResponse(res, 500, 'Failed to download model');
    }
  }
};

/**
 * 로그 다운로드 (파일 존재 여부 확인 후)
 * GET /api/artifacts/train_logs/:filename
 */
const downloadLogsHandler = async (req: Request, res: Response): Promise<void> => {
  const { filename } = req.params;
  
  if (!filename) {
    sendErrorResponse(res, 400, 'Filename is required');
    return;
  }

  // 파일명에서 runName 추출 (filename.csv -> filename)
  const runName = filename.replace(/\.csv$/, '');

  try {
    // 1. 파일 존재 여부 확인
    const checkResponse = await axios.get(`${FASTAPI_BASE}/api/artifacts/${runName}/check-all`, {
      timeout: 5000
    });

    if (!checkResponse.data.log?.exists) {
      logInfo("Download Logs", "Log file not found", { runName, filename });
      sendErrorResponse(res, 404, 'Log file not found');
      return;
    }

    // 2. 파일 다운로드 스트림
    const downloadResponse = await axios.get(`${FASTAPI_BASE}/api/artifacts/train_logs/${filename}`, {
      responseType: 'stream',
      timeout: 30000 // 30초 타임아웃
    });

    // 3. 응답 헤더 설정
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // 4. 스트림 파이프
    downloadResponse.data.pipe(res);
    
    logInfo("Download Logs", "Log download started", { runName, filename });
  } catch (error: any) {
    logError("Download Logs", error, { runName, filename });
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      sendErrorResponse(res, 503, 'FastAPI server unavailable');
    } else if (error.response?.status === 404) {
      sendErrorResponse(res, 404, 'Log file not found');
    } else {
      sendErrorResponse(res, 500, 'Failed to download logs');
    }
  }
};

// ===== 라우트 정의 =====

// 파일 존재 여부 확인
router.get('/:runName/check', asyncHandler(checkArtifactsHandler));

// 모델 다운로드 (개선된 버전)
router.get('/models/:filename', asyncHandler(downloadModelHandler));

// 로그 다운로드 (개선된 버전)
router.get('/train_logs/:filename', asyncHandler(downloadLogsHandler));

export default router;