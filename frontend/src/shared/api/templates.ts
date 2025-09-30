import { ApiClient } from './client';
import type {
  ApiResponse,
  Template,
  TemplateDetail,
  CreateTemplateRequest,
  TemplateNote,
  UpdateNoteRequest,
} from './types';

/**
 * 템플릿 관련 API 함수들
 */
export const templatesApi = {
  /**
   * 템플릿 목록 조회
   * GET /api/experiment-templates
   */
  getTemplates: (): Promise<ApiResponse<{ templates: Template[] }>> => {
    return ApiClient.get('/experiment-templates');
  },

  /**
   * 템플릿 상세 조회
   * GET /api/experiment-templates/:id
   */
  getTemplate: (id: string): Promise<ApiResponse<{ template: TemplateDetail }>> => {
    return ApiClient.get(`/experiment-templates/${id}`);
  },

  /**
   * 템플릿 생성
   * POST /api/experiment-templates
   */
  createTemplate: (data: CreateTemplateRequest): Promise<ApiResponse<{ templateId: string }>> => {
    return ApiClient.post('/experiment-templates', data);
  },

  /**
   * 템플릿 삭제
   * DELETE /api/experiment-templates/:id
   */
  deleteTemplate: (id: string): Promise<ApiResponse> => {
    return ApiClient.delete(`/experiment-templates/${id}`);
  },

  /**
   * 템플릿 노트 조회
   * GET /api/experiment-templates/:id/note
   */
  getTemplateNote: (id: string): Promise<ApiResponse<{ note: TemplateNote }>> => {
    return ApiClient.get(`/experiment-templates/${id}/note`);
  },

  /**
   * 템플릿 노트 수정
   * PATCH /api/experiment-templates/:id/note
   */
  updateTemplateNote: (
    id: string, 
    data: UpdateNoteRequest
  ): Promise<ApiResponse<{ template: TemplateDetail }>> => {
    return ApiClient.patch(`/experiment-templates/${id}/note`, data);
  },
};
