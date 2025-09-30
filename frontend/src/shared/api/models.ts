import { ApiClient } from './client';
import type {
  ApiResponse,
  Run,
  ModelTestRequest,
  ModelTestResponse,
  SimSpeedRequest,
} from './types';

// Teacher Model 관련 타입
export interface AvailableModel {
  runName: string;
  algName: string;
  envName: string;
  createdAt: string;
}

export interface AvailableModelsResponse {
  count: number;
  models: AvailableModel[];
}

/**
 * 모델 관련 API 함수들
 */
export const modelsApi = {
  /**
   * 모델 목록 조회 (실험 목록과 동일)
   * GET /api/models
   */
  getModels: (): Promise<ApiResponse<{ runs: Run[] }>> => {
    return ApiClient.get('/models');
  },

  /**
   * 모델 상세 조회 (실험 상세와 동일)
   * GET /api/models/:id
   */
  getModel: (id: string): Promise<ApiResponse<{ run: Run }>> => {
    return ApiClient.get(`/models/${id}`);
  },

  /**
   * 모델 삭제 (실험 삭제와 동일)
   * DELETE /api/models/:id
   */
  deleteModel: (id: string): Promise<ApiResponse> => {
    return ApiClient.delete(`/models/${id}`);
  },

  /**
   * 모델 상태 조회
   * GET /api/models/:id/status
   */
  getModelStatus: (id: string): Promise<ApiResponse<{ testStatus: string }>> => {
    return ApiClient.get(`/models/${id}/status`);
  },

  /**
   * 모델 테스트 시작
   * POST /api/models/:id/test
   */
  startModelTest: (
    id: string, 
    data: ModelTestRequest = {}
  ): Promise<ApiResponse<ModelTestResponse>> => {
    return ApiClient.post(`/models/${id}/test`, data);
  },

  /**
   * 모델 테스트 일시정지
   * POST /api/models/:id/pause
   */
  pauseModelTest: (id: string): Promise<ApiResponse> => {
    return ApiClient.post(`/models/${id}/pause`);
  },

  /**
   * 모델 테스트 재개
   * POST /api/models/:id/resume
   */
  resumeModelTest: (id: string): Promise<ApiResponse> => {
    return ApiClient.post(`/models/${id}/resume`);
  },

  /**
   * 모델 테스트 중지
   * POST /api/models/:id/stop
   */
  stopModelTest: (id: string): Promise<ApiResponse> => {
    return ApiClient.post(`/models/${id}/stop`);
  },

  /**
   * 모델 테스트 시뮬레이터 속도 변경
   * POST /api/models/:id/sim-speed
   */
  changeModelTestSimSpeed: (id: string, data: SimSpeedRequest): Promise<ApiResponse> => {
    return ApiClient.post(`/models/${id}/sim-speed`, data);
  },

  /**
   * 사용 가능한 Teacher Model 목록 조회
   * GET /api/runs/available-models?environment=envName
   */
  getAvailableModels: (environment?: string): Promise<ApiResponse<AvailableModelsResponse>> => {
    const url = environment ? `/runs/available-models?environment=${environment}` : '/runs/available-models';
    return ApiClient.get(url);
  },
};
