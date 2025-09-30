// 환경 변수에서 로그 레벨 가져오기
const getLogLevel = (): string => {
  return import.meta.env.VITE_LOG_LEVEL || 'info';
};

const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;
const logLevel = getLogLevel();

// 로그 스타일링 (개발 환경에서만)
const getLogStyle = (type: string) => {
  if (!isDevelopment) return '';
  
  const styles = {
    debug: 'color: #888; font-size: 11px;',
    info: 'color: #2196F3; font-weight: bold;',
    warn: 'color: #FF9800; font-weight: bold;',
    error: 'color: #F44336; font-weight: bold; background: #ffebee; padding: 2px 4px; border-radius: 2px;'
  };
  return styles[type as keyof typeof styles] || '';
};

// 로그 레벨 정의
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
} as const;

type LogLevel = keyof typeof LOG_LEVELS;

const shouldLog = (level: LogLevel): boolean => {
  if (isProduction && level !== 'error') {
    return false; // 프로덕션에서는 error만 출력
  }
  return LOG_LEVELS[level] >= LOG_LEVELS[logLevel as LogLevel];
};

let isDebug = false;

/**
 * 디버그 모드 활성화
 */
export function enable(): void {
  isDebug = true;
}

/**
 * 디버그 모드 비활성화
 */
export function disable(): void {
  isDebug = false;
}

/**
 * 디버그 로그 출력
 * 개발 환경에서만 출력되며, 디버그 모드가 활성화되어야 함
 * @param msg - 로그 메시지
 */
export function debug(msg: any): void {
  if (shouldLog('debug') && isDebug) {
    console.debug(`%c${msg}`, getLogStyle('debug'));
  }
}

/**
 * 정보 로그 출력
 * 일반적인 정보성 메시지를 출력
 * @param msg - 로그 메시지
 */
export function info(msg: any): void {
  if (shouldLog('info')) {
    console.info(`%c${msg}`, getLogStyle('info'));
  }
}

/**
 * 일반 로그 출력
 * info와 동일하지만 console.log 사용
 * @param msg - 로그 메시지
 */
export function log(msg: any): void {
  if (shouldLog('info')) {
    console.log(`%c${msg}`, getLogStyle('info'));
  }
}

/**
 * 경고 로그 출력
 * 주의가 필요한 상황을 알림
 * @param msg - 로그 메시지
 */
export function warn(msg: any): void {
  if (shouldLog('warn')) {
    console.warn(`%c${msg}`, getLogStyle('warn'));
  }
}

/**
 * 에러 로그 출력
 * 에러 상황을 알림
 * @param msg - 로그 메시지
 */
export function error(msg: any): void {
  if (shouldLog('error')) {
    console.error(`%c${msg}`, getLogStyle('error'));
  }
}

// ===== 카테고리별 로거 =====

/**
 * 실험 관련 로거
 * 실험의 시작, 일시정지, 완료, 에러 등을 로깅
 */
export const ExperimentLogger = {
  /**
   * 실험 시작 로그
   * @param msg - 로그 메시지
   */
  start: (msg: string) => {
    if (shouldLog('info')) {
      console.log(`🚀 실험: ${msg}`);
    }
  },

  /**
   * 실험 일시정지 로그
   * @param msg - 로그 메시지
   */
  pause: (msg: string) => {
    if (shouldLog('warn')) {
      console.warn(`⏸️ 실험: ${msg}`);
    }
  },

  /**
   * 실험 재개 로그
   * @param msg - 로그 메시지
   */
  resume: (msg: string) => {
    if (shouldLog('info')) {
      console.log(`▶️ 실험: ${msg}`);
    }
  },

  /**
   * 실험 완료 로그
   * @param msg - 로그 메시지
   */
  complete: (msg: string) => {
    if (shouldLog('info')) {
      console.log(`✅ 실험: ${msg}`);
    }
  },

  /**
   * 실험 중지 로그
   * @param msg - 로그 메시지
   */
  stop: (msg: string) => {
    if (shouldLog('warn')) {
      console.warn(`⏹️ 실험: ${msg}`);
    }
  },

  /**
   * 실험 에러 로그
   * @param msg - 로그 메시지
   */
  error: (msg: string) => {
    if (shouldLog('error')) {
      console.error(`❌ 실험: ${msg}`);
    }
  }
};

/**
 * API 관련 로거
 * API 요청, 응답, 에러 등을 로깅
 */
export const APILogger = {
  /**
   * API 요청 로그
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   * @param data - 요청 데이터 (선택사항)
   */
  request: (method: string, url: string, data?: any) => {
    if (shouldLog('debug')) {
      const logData = data ? ` | 데이터: ${JSON.stringify(data)}` : '';
      console.log(`📤 API 요청: ${method} ${url}${logData}`);
    }
  },

  /**
   * API 응답 로그
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   * @param status - 응답 상태 코드
   * @param data - 응답 데이터 (선택사항)
   */
  response: (method: string, url: string, status: number, data?: any) => {
    if (shouldLog('debug')) {
      const logData = data ? ` | 데이터: ${JSON.stringify(data)}` : '';
      console.log(`📥 API 응답: ${method} ${url} | 상태: ${status}${logData}`);
    }
  },

  /**
   * API 에러 로그
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   * @param error - 에러 객체
   */
  error: (method: string, url: string, error: any) => {
    if (shouldLog('error')) {
      console.error(`❌ API 에러: ${method} ${url}`, error);
    }
  }
};

/**
 * WebRTC 관련 로거
 * WebRTC 연결, 메시지, 이벤트 등을 로깅
 */
export const WebRTCLogger = {
  /**
   * WebRTC 연결 로그
   * @param msg - 로그 메시지
   */
  connection: (msg: string) => {
    if (shouldLog('info')) {
      console.log(`🔌 WebRTC: ${msg}`);
    }
  },

  /**
   * WebRTC 메시지 로그
   * @param msg - 로그 메시지
   */
  message: (msg: string) => {
    if (shouldLog('debug')) {
      console.log(`📨 WebRTC: ${msg}`);
    }
  },

  /**
   * WebRTC 이벤트 로그
   * @param event - 이벤트명
   */
  event: (event: string) => {
    if (shouldLog('debug')) {
      console.log(`⚡ WebRTC: ${event}`);
    }
  },

  /**
   * WebRTC 에러 로그
   * @param msg - 로그 메시지
   */
  error: (msg: string) => {
    if (shouldLog('error')) {
      console.error(`❌ WebRTC: ${msg}`);
    }
  }
};

/**
 * SSE(Server-Sent Events) 관련 로거
 * SSE 연결, 데이터, 이벤트 등을 로깅
 */
export const SSELogger = {
  /**
   * SSE 연결 로그
   * @param msg - 로그 메시지
   */
  connection: (msg: string) => {
    if (shouldLog('info')) {
      console.log(`🔗 SSE: ${msg}`);
    }
  },

  /**
   * SSE 데이터 로그
   * @param msg - 로그 메시지
   */
  data: (msg: string) => {
    if (shouldLog('debug')) {
      console.log(`📊 SSE: ${msg}`);
    }
  },

  /**
   * SSE 이벤트 로그
   * @param event - 이벤트명
   */
  event: (event: string) => {
    if (shouldLog('debug')) {
      console.log(`⚡ SSE: ${event}`);
    }
  },

  /**
   * SSE 에러 로그
   * @param msg - 로그 메시지
   */
  error: (msg: string) => {
    if (shouldLog('error')) {
      console.error(`❌ SSE: ${msg}`);
    }
  }
};

/**
 * UI 관련 로거
 * 사용자 인터랙션, 컴포넌트 상태 등을 로깅
 */
export const UILogger = {
  /**
   * 사용자 액션 로그
   * @param action - 액션명
   * @param details - 상세 정보 (선택사항)
   */
  action: (action: string, details?: any) => {
    if (shouldLog('info')) {
      const logDetails = details ? ` | 상세: ${JSON.stringify(details)}` : '';
      console.log(`👆 UI 액션: ${action}${logDetails}`);
    }
  },

  /**
   * 컴포넌트 상태 로그
   * @param component - 컴포넌트명
   * @param state - 상태 정보
   */
  state: (component: string, state: any) => {
    if (shouldLog('info')) {
      console.log(`🔄 UI 상태: ${component}`, state);
    }
  },

  /**
   * UI 에러 로그
   * @param component - 컴포넌트명
   * @param error - 에러 정보
   */
  error: (component: string, error: any) => {
    if (shouldLog('error')) {
      console.error(`❌ UI 에러: ${component}`, error);
    }
  }
};

/**
 * 성능 관련 로거
 * 성능 측정, 최적화 관련 로그를 출력
 */
export const PerformanceLogger = {
  /**
   * 성능 측정 시작
   * @param label - 측정 라벨
   */
  start: (label: string) => {
    if (shouldLog('debug')) {
      console.time(`⏱️ 성능: ${label}`);
    }
  },

  /**
   * 성능 측정 종료
   * @param label - 측정 라벨
   */
  end: (label: string) => {
    if (shouldLog('debug')) {
      console.timeEnd(`⏱️ 성능: ${label}`);
    }
  },

  /**
   * 성능 메트릭 로그
   * @param metric - 메트릭명
   * @param value - 값
   * @param unit - 단위 (선택사항)
   */
  metric: (metric: string, value: number, unit?: string) => {
    if (shouldLog('debug')) {
      const unitStr = unit ? ` ${unit}` : '';
      console.log(`📈 성능: ${metric} = ${value}${unitStr}`);
    }
  }
};
