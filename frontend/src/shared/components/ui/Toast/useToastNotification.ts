import { useToast } from './ToastContext';

/**
 * 토스트 알림 훅
 * 다양한 타입의 토스트 알림을 쉽게 표시할 수 있는 함수들을 제공
 * @returns 토스트 알림 함수들
 */
export const useToastNotification = () => {
  const { addToast } = useToast();

  /**
   * 성공 토스트 표시
   * @param message - 표시할 메시지
   * @param duration - 표시 시간 (밀리초, 기본값: 5000)
   */
  const showSuccess = (message: string, duration?: number) => {
    addToast({ type: 'success', message, duration });
  };

  /**
   * 에러 토스트 표시
   * @param message - 표시할 메시지
   * @param duration - 표시 시간 (밀리초, 기본값: 5000)
   */
  const showError = (message: string, duration?: number) => {
    addToast({ type: 'error', message, duration });
  };

  /**
   * 경고 토스트 표시
   * @param message - 표시할 메시지
   * @param duration - 표시 시간 (밀리초, 기본값: 5000)
   */
  const showWarning = (message: string, duration?: number) => {
    addToast({ type: 'warning', message, duration });
  };

  /**
   * 정보 토스트 표시
   * @param message - 표시할 메시지
   * @param duration - 표시 시간 (밀리초, 기본값: 5000)
   */
  const showInfo = (message: string, duration?: number) => {
    addToast({ type: 'info', message, duration });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
