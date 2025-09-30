/**
 * API URL을 환경에 따라 자동으로 결정하는 유틸리티
 */
export function getApiBaseUrl(): string {
  const isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (isDevelopment) {
    // 개발 모드: 환경 변수에서 가져온 URL 사용
    return baseUrl || 'http://localhost:8080';
  } else {
    // 프로덕션 모드: nginx를 통해 상대 경로 사용
    return '';
  }
}

/**
 * API 엔드포인트를 완전한 URL로 변환
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${endpoint}` : endpoint;
}

/**
 * WebSocket URL을 환경에 따라 결정
 */
export function getWebSocketUrl(): string {
  const isDevelopment = import.meta.env.VITE_IS_DEVELOPMENT === 'true';
  const signalingBaseUrl = import.meta.env.VITE_SIGNALING_BASE_URL;
  
  if (isDevelopment) {
    // 개발 모드: 환경 변수에서 가져온 URL 사용
    return signalingBaseUrl ? signalingBaseUrl.replace('http', 'ws') : 'ws://localhost:80/ws';
  } else {
    // 프로덕션 모드: 현재 호스트를 사용
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${location.host}/ws`;
  }
}