// 하위 호환성을 위해 re-export

export {
  enable,
  disable,
  debug,
  info,
  log,
  warn,
  error,
  WebRTCLogger as WebSocketLogger, // WebSocketLogger는 WebRTCLogger로 대체
  SSELogger
} from '@/shared/utils/logger';
