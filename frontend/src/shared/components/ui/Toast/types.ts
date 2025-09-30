/**
 * 토스트 타입 정의
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * 토스트 객체 인터페이스
 */
export interface Toast {
  /** 토스트 고유 ID */
  id: string;
  /** 토스트 타입 */
  type: ToastType;
  /** 표시할 메시지 */
  message: string;
  /** 표시 시간 (밀리초, 선택사항) */
  duration?: number;
}

/**
 * 토스트 컨텍스트 타입 인터페이스
 */
export interface ToastContextType {
  /** 현재 토스트 목록 */
  toasts: Toast[];
  /** 새 토스트 추가 함수 */
  addToast: (toast: Omit<Toast, 'id'>) => void;
  /** 특정 토스트 제거 함수 */
  removeToast: (id: string) => void;
  /** 모든 토스트 제거 함수 */
  clearToasts: () => void;
}
