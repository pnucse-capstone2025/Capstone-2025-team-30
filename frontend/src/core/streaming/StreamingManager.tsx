import { useEffect, useRef, useCallback } from 'react';
import { useExperimentStore } from '@/store/experimentStore';
import { buildApiUrl } from '@/shared/utils/apiUrl';
import { SSELogger } from '@/core/webrtc/logger';

export default function StreamingManager() {
  const runId = useExperimentStore((s) => s.runId);
  const status = useExperimentStore((s) => s.trainingStatus);
  const appendTrainingMetric = useExperimentStore((s) => s.appendTrainingMetric);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const lastEventIdRef = useRef<string | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // 1초

  const connectSSE = useCallback(() => {
    SSELogger.connection(`연결 시도: runId=${runId}, status=${status}`);
    
    if (!runId || status !== 'running') {
      SSELogger.connection('연결 건너뜀: runId 없음 또는 실행 중이 아님');
      return;
    }

    // 기존 연결 정리
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // 재연결 시도 횟수 초과 시 중단
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      SSELogger.error('최대 재연결 시도 횟수 도달');
      return;
    }

    SSELogger.connection(`연결 중: runId=${runId} (시도 ${reconnectAttempts.current + 1})`);
    SSELogger.data(`URL: ${buildApiUrl(`/api/training-metrics/stream/${runId}`)}`);
    
    // Last Event ID가 있으면 헤더에 포함
    let url = buildApiUrl(`/api/training-metrics/stream/${runId}`);
    if (lastEventIdRef.current) {
      url += `?lastEventId=${encodeURIComponent(lastEventIdRef.current)}`;
      SSELogger.connection(`Last Event ID: ${lastEventIdRef.current}`);
    }
    
    const es = new EventSource(url, {
      withCredentials: false
    });
    eventSourceRef.current = es;

    es.onopen = () => {
      SSELogger.connection('연결 성공');
      reconnectAttempts.current = 0; // 연결 성공 시 재시도 횟수 리셋
    };

    es.onmessage = (e) => {
      try {
        // Last Event ID 업데이트
        if (e.lastEventId) {
          lastEventIdRef.current = e.lastEventId;
        }
        
        const data = JSON.parse(e.data);
        SSELogger.data(`데이터 수신: ${JSON.stringify(data).substring(0, 100)}...`);
        
        // 연결 확인 메시지는 무시
        if (data.type === 'connected') {
          SSELogger.connection('연결 확인됨');
          return;
        }
        
        // 하트비트 메시지는 무시
        if (data.type === 'ping') {
          SSELogger.connection('하트비트 수신');
          return;
        }
        
        // 메트릭 데이터 처리 - chartMetrics 확인
        if (data.timesteps && data.chartMetrics) {
          SSELogger.event('메트릭 데이터 처리 중');
          appendTrainingMetric(data);
        } else {
          SSELogger.error(`잘못된 데이터 형식: ${JSON.stringify(data).substring(0, 50)}...`);
        }
      } catch (error) {
        SSELogger.error(`데이터 파싱 오류: ${error}`);
      }
    };

    es.onerror = (error) => {
      SSELogger.error(`연결 오류: ${error}`);
      
      // 연결 상태 확인
      if (es.readyState === EventSource.CLOSED) {
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current - 1);
          SSELogger.connection(`${delay}ms 후 재연결 시도... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, delay);
        } else {
          SSELogger.error('최대 재연결 시도 횟수 도달. 연결을 중단합니다.');
        }
      } else if (es.readyState === EventSource.CONNECTING) {
        SSELogger.connection('연결 중...');
      }
    };
  }, [runId, status, appendTrainingMetric]);

  useEffect(() => {
    if (runId && status === 'running') {
      connectSSE();
    } else {
      // 학습이 중단되면 연결 해제
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      reconnectAttempts.current = 0;
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [runId, status, connectSSE]);

  return null;
}
