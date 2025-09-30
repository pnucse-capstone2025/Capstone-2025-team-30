import { ApiClient } from './client';

/**
 * API 응답 타입 (로컬 정의)
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Artifact 관련 타입 정의
 */
export interface ArtifactCheckResponse {
  run_name: string;
  model: {
    file_name: string;
    exists: boolean;
    path?: string;
  };
  log: {
    file_name: string;
    exists: boolean;
    path?: string;
  };
}

/**
 * Artifacts API 함수들
 */
export const artifactsApi = {
  /**
   * 파일 존재 여부 확인
   * GET /api/artifacts/:runName/check
   */
  checkArtifacts: (runName: string): Promise<ApiResponse<ArtifactCheckResponse>> => {
    return ApiClient.get(`/artifacts/${runName}/check`);
  },

  /**
   * 모델 다운로드 (파일 존재 여부 확인 후)
   * GET /api/artifacts/models/:filename
   */
  downloadModel: async (runName: string): Promise<{ success: boolean; message: string }> => {
    try {
      const filename = `${runName}.zip`;
      const response = await fetch(`/api/artifacts/models/${encodeURIComponent(filename)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true, message: '모델 다운로드를 성공했습니다.' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || '모델 다운로드에 실패했습니다.' 
      };
    }
  },

  /**
   * 로그 다운로드 (파일 존재 여부 확인 후)
   * GET /api/artifacts/train_logs/:filename
   */
  downloadLogs: async (runName: string): Promise<{ success: boolean; message: string }> => {
    try {
      const filename = `${runName}.csv`;
      const response = await fetch(`/api/artifacts/train_logs/${encodeURIComponent(filename)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true, message: '로그 다운로드를 성공했습니다.' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || '학습 로그 다운로드에 실패했습니다.' 
      };
    }
  },

  /**
   * 모델 다운로드 (기존 방식 - window.location.href)
   * 호환성을 위해 유지
   */
  downloadModelLegacy: (runName: string) => {
    const filename = `${runName}.zip`;
    window.location.href = `/api/artifacts/models/${encodeURIComponent(filename)}`;
  },

  /**
   * 로그 다운로드 (기존 방식 - window.location.href)
   * 호환성을 위해 유지
   */
  downloadLogsLegacy: (runName: string) => {
    const filename = `${runName}.csv`;
    window.location.href = `/api/artifacts/train_logs/${encodeURIComponent(filename)}`;
  }
};
