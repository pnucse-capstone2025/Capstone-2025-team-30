import { ApiClient } from './client';
import type { ApiResponse } from './types';

/**
 * 알고리즘 관련 API 함수들
 */
export const algorithmsApi = {
  /**
   * 알고리즘 목록 조회
   * GET /api/algorithms?environment=envName
   */
  getAlgorithms: (environment?: string): Promise<ApiResponse<{ algorithms: string[] }>> => {
    const url = environment ? `/algorithms?environment=${environment}` : '/algorithms';
    return ApiClient.get(url);
  },

  /**
   * 알고리즘 스키마 조회
   * GET /api/algorithms/:name
   */
  getAlgorithmSchema: (name: string): Promise<ApiResponse<any>> => {
    return ApiClient.get(`/algorithms/${name}`);
  },
};
