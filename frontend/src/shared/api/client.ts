import type { ApiResponse, ApiError } from './types';

/**
 * API 클라이언트 기본 설정
 */
const API_BASE = '/api';

/**
 * API 요청 옵션 인터페이스
 */
interface RequestOptions extends RequestInit {
  timeout?: number;
}

/**
 * API 클라이언트 클래스
 * 공통 fetch 로직과 에러 처리를 담당
 */
export class ApiClient {
  /**
   * 기본 요청 헤더
   */
  private static getDefaultHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    };
  }

  /**
   * 공통 요청 처리 메서드
   */
  private static async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = 10000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers: {
          ...this.getDefaultHeaders(),
          ...fetchOptions.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`,
        }));
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다.');
        }
        throw error;
      }
      
      throw new Error('알 수 없는 오류가 발생했습니다.');
    }
  }

  /**
   * GET 요청
   */
  static async get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST 요청
   */
  static async post<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT 요청
   */
  static async put<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE 요청
   */
  static async delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * PATCH 요청
   */
  static async patch<T>(
    endpoint: string, 
    data?: any, 
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}
