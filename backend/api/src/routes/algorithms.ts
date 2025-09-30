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
 * 알고리즘 목록 조회
 * GET /api/algorithms?environment=envName
 */
const getAlgorithmsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { environment } = req.query;
    const response = await fetch(`${FASTAPI_BASE}/algorithms`);

    if (!response.ok) {
      throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    let algorithms = data.algorithms || [];
    
    // cnn_car 환경이 아니면 hf-llm 제거
    if (environment && environment !== 'cnn_car') {
      algorithms = algorithms.filter((alg: string) => alg !== 'hf-llm');
    }
    
    logInfo("Algorithms", "Successfully fetched algorithms list", { environment, filteredCount: algorithms.length });
    sendSuccessResponse(res, { algorithms });
  } catch (error) {
    logError("Get Algorithms", error);
    sendErrorResponse(res, 500, 'Failed to fetch algorithms');
  }
};

/**
 * 특정 알고리즘 스키마 조회
 * GET /api/algorithms/:algo
 */
const getAlgorithmSchemaHandler = async (req: Request, res: Response): Promise<void> => {
  const { algo } = req.params;
  
  if (!algo) {
    sendErrorResponse(res, 400, 'Algorithm name is required');
    return;
  }

  try {
    const response = await fetch(`${FASTAPI_BASE}/algorithms/${encodeURIComponent(algo)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        sendErrorResponse(res, 404, 'Algorithm not found');
        return;
      }
      throw new Error(`FastAPI error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logInfo("Algorithm Schema", "Successfully fetched algorithm schema", { algorithm: algo });
    sendSuccessResponse(res, data);
  } catch (error) {
    logError("Get Algorithm Schema", error, { algorithm: algo });
    sendErrorResponse(res, 500, 'Failed to fetch algorithm schema');
  }
};

// ===== 라우트 정의 =====

router.get('/', asyncHandler(getAlgorithmsHandler));
router.get('/:algo', asyncHandler(getAlgorithmSchemaHandler));

export default router;