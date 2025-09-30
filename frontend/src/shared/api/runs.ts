import { ApiClient } from './client';
import type {
  ApiResponse,
  Run,
  CreateRunRequest,
  RunStatus,
  SimSpeedRequest,
} from './types';
import type { RunInfo } from '@/shared/types/results';

/**
 * 실험(Run) 관련 API 함수들
 */
export const runsApi = {
  /**
   * 실험 목록 조회
   * GET /api/runs
   */
  getRuns: (): Promise<ApiResponse<{ runs: Run[] }>> => {
    return ApiClient.get('/runs');
  },

  /**
   * 실험 상세 조회
   * GET /api/runs/:id
   */
  getRun: (id: string): Promise<ApiResponse<{ run: Run }>> => {
    return ApiClient.get(`/runs/${id}`);
  },

  /**
   * 실험 생성
   * POST /api/experiment-templates/:templateId/runs
   */
  createRun: (
    templateId: string, 
    data: CreateRunRequest
  ): Promise<ApiResponse<{ runId: string, runName: string | null }>> => {
    return ApiClient.post(`/experiment-templates/${templateId}/runs`, data);
  },

  /**
   * 실험 삭제
   * DELETE /api/runs/:id
   */
  deleteRun: (id: string): Promise<ApiResponse> => {
    return ApiClient.delete(`/runs/${id}`);
  },

  /**
   * 실험 상태 조회
   * GET /api/runs/:id/status
   */
  getRunStatus: (id: string): Promise<ApiResponse<RunStatus>> => {
    return ApiClient.get(`/runs/${id}/status`);
  },

  /**
   * 실험 일시정지
   * POST /api/runs/:id/pause
   */
  pauseRun: (id: string): Promise<ApiResponse> => {
    return ApiClient.post(`/runs/${id}/pause`);
  },

  /**
   * 실험 재개
   * POST /api/runs/:id/resume
   */
  resumeRun: (id: string): Promise<ApiResponse> => {
    return ApiClient.post(`/runs/${id}/resume`);
  },

  /**
   * 실험 중지
   * POST /api/runs/:id/stop
   */
  stopRun: (id: string): Promise<ApiResponse> => {
    return ApiClient.post(`/runs/${id}/stop`);
  },

  /**
   * 시뮬레이터 속도 변경
   * POST /api/runs/:id/sim-speed
   */
  changeSimSpeed: (id: string, data: SimSpeedRequest): Promise<ApiResponse> => {
    return ApiClient.post(`/runs/${id}/sim-speed`, data);
  },

  /**
   * 환경별 실험 목록 조회
   * GET /api/runs/environments/:envName
   */
  getRunsByEnvironment: (envName: string): Promise<ApiResponse<{ 
    envName: string; 
    count: number; 
    runs: Array<{
      runId: string;
      runName: string;
      algName: string;
      status: string;
      createdAt: string;
    }>
  }>> => {
    return ApiClient.get(`/runs/environments/${encodeURIComponent(envName)}`);
  },

  /**
   * 피드백 전송
   * POST /api/runs/:id/feedback
   */
  sendFeedback: (id: string, feedback: { text: string }): Promise<ApiResponse> => {
    return ApiClient.post(`/runs/${id}/feedback`, feedback);
  },

  /**
   * 런 정보 조회 (Results 페이지용)
   * Results 페이지에 특화된 RunInfo 형태로 변환하여 반환
   * 
   * @param runId - 조회할 런 ID
   * @returns RunInfo 객체
   */
  getRunInfo: async (runId: string): Promise<RunInfo> => {
    const response = await ApiClient.get(`/runs/${runId}`);
    
    if (!response.data || !(response.data as any).run) {
      throw new Error('Run not found');
    }
    
    const run = (response.data as any).run as Run;
    
    return {
      runId: run.runId,
      runName: run.runName,
      status: run.status,
      envName: run.envName,
      algName: run.algName,
      createdAt: run.createdAt,
      startTime: run.startTime,
      endTime: run.endTime,
      envConfig: run.envConfig,
      algConfig: run.algConfig,
    } as RunInfo;
  },
};
