import { Router, Request, Response } from 'express';
import { 
  sendErrorResponse, 
  sendSuccessResponse, 
  asyncHandler, 
  logError, 
  logInfo 
} from '../utils/apiHelpers';

const router = Router();
const FASTAPI_BASE = process.env.FASTAPI_BASE || 'http://localhost:8000';

/**
 * 환경 목록 조회
 * GET /api/environments
 */
const getEnvironmentsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await fetch(`${FASTAPI_BASE}/environments`);
    
    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logInfo("Environments", "Successfully fetched environments list");
    sendSuccessResponse(res, data);
  } catch (error) {
    logError("Get Environments", error);
    sendErrorResponse(res, 500, 'Failed to fetch environments');
  }
};

/**
 * 특정 환경 스키마 조회
 * GET /api/environments/:env
 */
const getEnvironmentSchemaHandler = async (req: Request, res: Response): Promise<void> => {
  const { env } = req.params;
  
  if (!env) {
    sendErrorResponse(res, 400, 'Environment name is required');
    return;
  }

  try {
    const response = await fetch(`${FASTAPI_BASE}/environments/${encodeURIComponent(env)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        sendErrorResponse(res, 404, 'Environment not found');
        return;
      }
      throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logInfo("Environment Schema", "Successfully fetched environment schema", { environment: env });
    sendSuccessResponse(res, data);
  } catch (error) {
    logError("Get Environment Schema", error, { environment: env });
    sendErrorResponse(res, 500, 'Failed to fetch environment schema');
  }
};

// ===== 라우트 정의 =====

router.get('/', asyncHandler(getEnvironmentsHandler));
router.get('/:env', asyncHandler(getEnvironmentSchemaHandler));

export default router;