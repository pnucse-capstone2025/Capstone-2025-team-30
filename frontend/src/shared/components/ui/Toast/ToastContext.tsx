import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Toast, ToastContextType } from './types';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * 토스트 컨텍스트 훅
 * ToastProvider 내부에서만 사용 가능
 * @returns 토스트 컨텍스트 객체
 * @throws {Error} ToastProvider 외부에서 사용 시 에러 발생
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * 토스트 프로바이더 컴포넌트
 * 앱 전체에 토스트 기능을 제공
 * @param children - 자식 컴포넌트들
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 토스트 목록 상태
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * 새 토스트 추가
   * @param toast - 추가할 토스트 정보 (id 제외)
   */
  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  /**
   * 특정 토스트 제거
   * @param id - 제거할 토스트의 ID
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 모든 토스트 제거
   */
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  );
};
