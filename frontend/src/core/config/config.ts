import { getServers } from "@/core/config/icesettings";

/**
 * 서버 설정 응답 인터페이스
 */
interface ServerConfig {
  /** WebSocket 사용 여부 */
  useWebSocket: boolean;
  /** 시작 모드 */
  startupMode: string;
}

/**
 * 서버 설정 정보를 가져오는 함수
 * API를 통해 서버의 WebSocket 사용 여부와 시작 모드를 조회
 * 
 * @returns 서버 설정 정보를 포함한 Promise
 */
export async function getServerConfig(): Promise<ServerConfig> {
  const configEndpoint = '/config';
  const response = await fetch(configEndpoint);
  return await response.json();
}

/**
 * WebRTC 연결 설정을 생성하는 함수
 * ICE 서버 정보를 포함한 RTCConfiguration 객체를 반환
 * 
 * @returns WebRTC 연결 설정 객체
 */
export function getRTCConfiguration(): RTCConfiguration {
  const rtcConfig: RTCConfiguration = {
    iceServers: getServers()
  };
  return rtcConfig;
}
