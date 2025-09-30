import { useEffect, useRef, useState } from 'react';
import { VideoPlayer } from '@/core/streaming/videoplayer';
import { RenderStreaming } from '@/core/webrtc/renderstreaming';
import { Signaling, WebSocketSignaling } from '@/core/webrtc/signaling';
import { getRTCConfiguration } from '@/core/config/config';
import { useExperimentStore } from '@/store/experimentStore';
import { useServerConfig } from '@/shared/hooks';
import { WebRTCLogger, UILogger } from '@/shared/utils/logger';
import {
  SimulatorContainer,
  VideoContainer,
  ControlsContainer,
  ControlGroup,
  StatusIndicator,
  ActionButton
} from '@/shared/components/styles';
import { FlatCard } from '@/shared/components/ui/Card';

/**
 * 테스트 시뮬레이터 컴포넌트
 * 모델 테스트 실행 중 Unity 시뮬레이터의 비디오 스트림을 표시하고 제어
 * WebRTC를 통한 실시간 스트리밍과 피드백 기능을 제공
 */
export default function TestSimulator() {
  // WebRTC 관련 참조
  const renderStreamingRef = useRef<RenderStreaming | null>(null);
  const videoPlayerRef = useRef<VideoPlayer>(null);
  
  // DOM 참조
  const playerDivRef = useRef<HTMLDivElement>(null);
  const lockMouseCheckRef = useRef<HTMLInputElement>(null);
  
  // 상태 관리
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const prevTestingStatusRef = useRef<string | null>(null);
  
  // 실험 관련 상태
  const testingStatus = useExperimentStore(state => state.testingStatus);

  // 서버 설정 훅 사용
  const { useWebSocket } = useServerConfig();

  /**
   * VideoPlayer 초기화
   * 컴포넌트 마운트 시 VideoPlayer 인스턴스를 생성
   */
  useEffect(() => {
    videoPlayerRef.current = new VideoPlayer();
    return () => {
      onDisconnect();
    };
  }, []);

  /**
   * WebRTC 연결 자동 시작
   * 테스트 상태가 testing 또는 paused이고 필요한 설정이 완료되면 자동으로 연결을 시작
   */
  useEffect(() => {
    if (
      (testingStatus === 'testing' || testingStatus === 'paused') &&
      useWebSocket !== null &&
      !renderStreamingRef.current &&
      playerDivRef.current &&
      videoPlayerRef.current
    ) {
      const connectionTimeoutId = setTimeout(() => {
        startConnection();
      }, 2000);
      return () => clearTimeout(connectionTimeoutId);
    }
  }, [testingStatus, useWebSocket]);

  /**
   * 테스트 상태 변화 감지
   * 테스트가 종료되면 WebRTC 연결을 정리
   */
  useEffect(() => {
    const previousStatus = prevTestingStatusRef.current;
    if ((previousStatus === 'testing' || previousStatus === 'paused') && 
        !(testingStatus === 'testing' || testingStatus === 'paused')) {
      if (renderStreamingRef.current || videoPlayerRef.current) {
        void onDisconnect();
      }
    }
    prevTestingStatusRef.current = testingStatus ?? null;
  }, [testingStatus]);

  /**
   * WebRTC 연결 시작
   * VideoPlayer를 초기화하고 RenderStreaming을 설정
   */
  const startConnection = async (): Promise<void> => {
    if (playerDivRef.current && videoPlayerRef.current) {
      const lockMouseElement = lockMouseCheckRef.current || document.createElement('input');
      if (!lockMouseCheckRef.current) {
        lockMouseElement.type = 'checkbox';
        lockMouseElement.checked = false;
      }
      
      videoPlayerRef.current.createPlayer(playerDivRef.current, lockMouseElement as HTMLInputElement);
      await setupRenderStreaming();
    }
  };

  /**
   * RenderStreaming 설정
   * WebRTC 연결을 위한 RenderStreaming 인스턴스를 생성하고 설정
   */
  const setupRenderStreaming = async (): Promise<void> => {
    if (renderStreamingRef.current) {
      await onDisconnect();
    }

    const signaling = useWebSocket ? new WebSocketSignaling() : new Signaling();
    const config = getRTCConfiguration();

    const renderStreaming = new RenderStreaming(signaling, config);
    renderStreamingRef.current = renderStreaming;

    renderStreaming.onConnect = onConnect;
    renderStreaming.onDisconnect = onDisconnect;
    renderStreaming.onTrackEvent = ({ track }) => {
      if (videoPlayerRef.current) {
        videoPlayerRef.current.addTrack(track);
      }
    };

    await renderStreaming.start();
    await renderStreaming.createConnection();
    setIsConnected(true);
  };

  /**
   * WebRTC 연결 성공 핸들러
   * 데이터 채널을 생성하고 입력을 설정
   */
  const onConnect = (): void => {
    if (renderStreamingRef.current && videoPlayerRef.current) {
      const dataChannel = renderStreamingRef.current.createDataChannel('input');
      videoPlayerRef.current.setupInput(dataChannel);
    }
  };

  /**
   * WebRTC 연결 해제 핸들러
   * VideoPlayer와 RenderStreaming을 정리
   */
  const onDisconnect = async (): Promise<void> => {
    setIsConnected(false);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.deletePlayer();
    }
    if (renderStreamingRef.current) {
      try {
        await renderStreamingRef.current.stop();
      } catch (error) {
        WebRTCLogger.error(`RenderStreaming 정지 실패: ${error}`);
      }
      renderStreamingRef.current = null;
    }
  };

  /**
   * 재연결 핸들러
   * WebRTC 연결을 정리하고 다시 연결을 시도
   */
  const handleReconnect = async (): Promise<void> => {
    if (isReconnecting) return; // 중복 실행 방지
    
    UILogger.action('WebRTC 재연결 시도');
    setIsReconnecting(true);
    
    try {
      // 기존 연결 정리
      await onDisconnect();
      
      // 잠시 대기 후 재연결
      setTimeout(async () => {
        if (testingStatus === 'testing' || testingStatus === 'paused') {
          try {
            await startConnection();
            UILogger.action('WebRTC 재연결 성공');
          } catch (error) {
            UILogger.error('TestSimulator', `재연결 실패: ${error}`);
          }
        }
        setIsReconnecting(false);
      }, 1000);
      
    } catch (error) {
      UILogger.error('TestSimulator', `재연결 중 오류: ${error}`);
      setIsReconnecting(false);
    }
  };

  return (
    <FlatCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SimulatorContainer>
        <VideoContainer ref={playerDivRef} />
        
        <ControlsContainer>
          <ControlGroup>
          </ControlGroup>

          <ControlGroup>
            {(testingStatus === 'testing' || testingStatus === 'paused') && (
              <ActionButton 
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                {isReconnecting ? '재연결 중...' : '재연결'}
              </ActionButton>
            )}
            {/*<MouseLockControl>
              <input
                type="checkbox"
                ref={lockMouseCheckRef}
              />
              마우스 잠금
            </MouseLockControl>*/}
            <StatusIndicator $connected={isConnected}>
              {isConnected ? '연결됨' : '연결 안됨'}
            </StatusIndicator>
          </ControlGroup>
        </ControlsContainer>
      </SimulatorContainer>
    </FlatCard>
  );
}