import { VideoPlayer } from '@/core/streaming/videoplayer';
import { RenderStreaming } from '@/core/webrtc/renderstreaming';
import { Signaling, WebSocketSignaling } from '@/core/webrtc/signaling';
import { getRTCConfiguration } from '@/core/config/config';
import { useEffect, useRef, useState } from 'react';
import { useExperimentStore } from '@/store/experimentStore';
import { useServerConfig } from '@/shared/hooks';
import { useSimulationSpeed } from '../../hooks/useSimulationSpeed';
import { WebRTCLogger, UILogger } from '@/shared/utils/logger';
import FeedbackArea from './components/FeedbackArea';
import {
  SimulatorContainer,
  VideoContainer,
  ControlsContainer,
  ControlGroup,
  SpeedControl,
  SpeedLabel,
  SpeedSlider,
  SpeedLabels,
  SpeedValue,
  /*MouseLockControl,*/
  StatusIndicator,
  ActionButton
} from '@/shared/components/styles';
import { FlatCard } from '@/shared/components/ui/Card';

/**
 * 시뮬레이터 컴포넌트
 * 실험 실행 중 Unity 시뮬레이터의 비디오 스트림을 표시하고 제어
 * WebRTC를 통한 실시간 스트리밍과 피드백 기능을 제공
 */
export default function Simulator() {
  // WebRTC 관련 참조
  const renderstreamingRef = useRef<RenderStreaming | null>(null);
  const videoPlayerRef = useRef<VideoPlayer>(null);
  
  // DOM 참조
  const playerDivRef = useRef<HTMLDivElement>(null);
  const lockMouseCheckRef = useRef<HTMLInputElement>(null);
  
  // 상태 관리
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const prevTrainingStatusRef = useRef<string | null>(null);
  
  // 실험 관련 상태
  const trainingStatus = useExperimentStore(state => state.trainingStatus);
  const canConnect = useExperimentStore(state => state.canConnect);
  const setCanConnect = useExperimentStore(state => state.setCanConnect);
  const speedLevel = useExperimentStore(state => state.trainingSpeedLevel);
  const algName = useExperimentStore(state => state.templateConfig?.algName);

  // 시뮬레이션 속도 조절
  const currentRunId = useExperimentStore(state => state.runId);
  const { handleSpeedChange, SPEED_SETTINGS } = useSimulationSpeed();
  


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
   * 실험 상태가 running 또는 paused이고 필요한 설정이 완료되고 canConnect가 true일 때 자동으로 연결을 시작
   */
  useEffect(() => {
    if (
      (trainingStatus === 'running' || trainingStatus === 'paused') &&
      useWebSocket !== null &&
      !renderstreamingRef.current &&
      playerDivRef.current &&
      videoPlayerRef.current &&
      canConnect === true
    ) {
      const connectionTimeoutId = setTimeout(() => {
        startConnection();
      }, 2000);
      return () => clearTimeout(connectionTimeoutId);
    }
  }, [trainingStatus, useWebSocket, canConnect]);

  /**
   * 훈련 상태 변화 감지
   * 훈련이 종료되면 WebRTC 연결을 정리
   */
  useEffect(() => {
    const previousStatus = prevTrainingStatusRef.current;
    if ((previousStatus === 'running' || previousStatus === 'paused') && 
        !(trainingStatus === 'running' || trainingStatus === 'paused')) {
      if (renderstreamingRef.current || videoPlayerRef.current) {
        void onDisconnect();
      }
    }
    prevTrainingStatusRef.current = trainingStatus ?? null;
  }, [trainingStatus]);

  /**
   * WebRTC 연결 시작
   * VideoPlayer를 초기화하고 RenderStreaming을 설정
   */
  async function startConnection() {
    if (playerDivRef.current && videoPlayerRef.current) {
      const lockMouseElement = lockMouseCheckRef.current || document.createElement('input');
      if (!lockMouseCheckRef.current) {
        lockMouseElement.type = 'checkbox';
        lockMouseElement.checked = false;
      }
      
      videoPlayerRef.current.createPlayer(playerDivRef.current, lockMouseElement as HTMLInputElement);
      await setupRenderStreaming();
    }
  }

  /**
   * RenderStreaming 설정
   * WebRTC 연결을 위한 RenderStreaming 인스턴스를 생성하고 설정
   */
  async function setupRenderStreaming() {
    if (renderstreamingRef.current) {
      await onDisconnect();
    }

    const signaling = useWebSocket ? new WebSocketSignaling() : new Signaling();
    const config = getRTCConfiguration();

    const renderStreaming = new RenderStreaming(signaling, config);
    renderstreamingRef.current = renderStreaming;

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
  }

  /**
   * WebRTC 연결 성공 핸들러
   * 데이터 채널을 생성하고 입력을 설정
   */
  function onConnect() {
    if (renderstreamingRef.current && videoPlayerRef.current) {
      const dataChannel = renderstreamingRef.current.createDataChannel('input');
      videoPlayerRef.current.setupInput(dataChannel);
    }
  }

  /**
   * WebRTC 연결 해제 핸들러
   * VideoPlayer와 RenderStreaming을 정리하고 canConnect를 false로 설정
   */
  async function onDisconnect() {
    setIsConnected(false);
    setCanConnect(false);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.deletePlayer();
    }
    if (renderstreamingRef.current) {
      try {
        await renderstreamingRef.current.stop();
      } catch (error) {
        WebRTCLogger.error(`RenderStreaming 정지 실패: ${error}`);
      }
      renderstreamingRef.current = null;
    }
  }

  /**
   * 재연결 핸들러
   * WebRTC 연결을 정리하고 다시 연결을 시도
   */
  const handleReconnect = async () => {
    if (isReconnecting) return; // 중복 실행 방지
    
    UILogger.action('WebRTC 재연결 시도');
    setIsReconnecting(true);
    
    try {
      // 기존 연결 정리
      await onDisconnect();
      
      // 잠시 대기 후 재연결
      setTimeout(async () => {
        if (trainingStatus === 'running' || trainingStatus === 'paused') {
          try {
            await startConnection();
            UILogger.action('WebRTC 재연결 성공');
          } catch (error) {
            UILogger.error('Simulator', `재연결 실패: ${error}`);
          }
        }
        setIsReconnecting(false);
      }, 1000);
      
    } catch (error) {
      UILogger.error('Simulator', `재연결 중 오류: ${error}`);
      setIsReconnecting(false);
    }
  };

  const currentSpeed = SPEED_SETTINGS[speedLevel as keyof typeof SPEED_SETTINGS];

  return (
    <FlatCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <SimulatorContainer>
        <VideoContainer ref={playerDivRef} />
        
        <ControlsContainer>
          <ControlGroup>
            <SpeedControl>
              <SpeedLabel>속도</SpeedLabel>
              <div>
                <SpeedSlider
                  min="1"
                  max="4"
                  step="1"
                  value={speedLevel}
                  onChange={(e) => handleSpeedChange(currentRunId, parseInt(e.target.value))}
                  disabled={!isConnected}
                />
                <SpeedLabels>
                  <span>느림</span>
                  <span>보통</span>
                  <span>빠름</span>
                  <span>매우빠름</span>
                </SpeedLabels>
              </div>
              <SpeedValue>{currentSpeed.label}</SpeedValue>
            </SpeedControl>
          </ControlGroup>

          <ControlGroup>
            {(trainingStatus === 'running' || trainingStatus === 'paused') && (
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
        {algName === 'hf-llm' && (
          <FeedbackArea />
        )}
    </FlatCard>
  );
}