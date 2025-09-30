import { ApiClient } from './client';
import type { ApiResponse } from './types';

/**
 * 환경 관련 API 함수들
 */
export const environmentsApi = {
  /**
   * 환경 목록 조회
   * GET /api/environments
   */
  getEnvironments: (): Promise<ApiResponse<{ environments: string[] }>> => {
    return ApiClient.get('/environments');
  },

  /**
   * 환경 스키마 조회
   * GET /api/environments/:name
   */
  getEnvironmentSchema: (name: string): Promise<ApiResponse<any>> => {
    return ApiClient.get(`/environments/${name}`);
  },
};
