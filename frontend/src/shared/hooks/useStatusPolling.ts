import { useEffect, useRef, useCallback } from 'react';

/**
 * 상태 폴링을 위한 커스텀 훅
 * @param id 폴링할 대상 ID (예: runId, testModelId)
 * @param pollingFunction 폴링 함수
 * @param setStatus 상태 설정 함수
 * @param getCurrentStatus 현재 상태를 가져오는 함수
 * @param interval 폴링 간격 (밀리초, 기본값: 3000)
 * @returns 즉시 폴링을 실행할 수 있는 함수
 */
export const useStatusPolling = <T>(
  id: string | null,
  pollingFunction: (id: string) => Promise<T>,
  setStatus: (status: T) => void,
  getCurrentStatus: () => T,
  interval: number = 3000
) => {
  const intervalRef = useRef<number | null>(null);

  // 폴링 실행 함수
  const pollStatus = useCallback(async () => {
    if (!id) return;

    try {
      const newStatus = await pollingFunction(id);
      const currentStatus = getCurrentStatus();

      if (newStatus !== currentStatus) {
        console.log(`Status updated: ${currentStatus} -> ${newStatus}`);
        setStatus(newStatus);
      }
    } catch (error) {
      console.error('Error polling status:', error);
    }
  }, [id, pollingFunction, setStatus, getCurrentStatus]);

  // 즉시 폴링 실행 함수 (외부에서 호출 가능)
  const triggerPolling = useCallback(() => {
    pollStatus();
  }, [pollStatus]);

  useEffect(() => {
    if (!id) return;

    // 즉시 한 번 실행
    pollStatus();
    
    // 주기적으로 실행
    intervalRef.current = window.setInterval(pollStatus, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, pollStatus, interval]);

  // 즉시 폴링 함수 반환
  return triggerPolling;
};
