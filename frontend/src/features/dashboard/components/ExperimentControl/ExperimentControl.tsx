import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useExperimentStore } from "@/store/experimentStore";
import { useMultipleModals, useStatusPolling, useToastNotification } from "@/shared/hooks";
import { runsApi } from "@/shared/api";
import { ExperimentLogger } from "@/shared/utils/logger";
import TemplateCreateModal from "@/features/dashboard/components/ExperimentControl/components/TemplateCreateModal/TemplateCreateModal";
import TemplateListModal from "@/features/dashboard/components/ExperimentControl/components/TemplateListModal/TemplateListModal";
import StepSetModal from "@/shared/components/StepSetModal";
import {
  HeaderSection,
  TopBar,
  ProjectName,
  ButtonGroup,
} from '@/shared/components/styles';
import {
  ActionButton,
  StartButton,
  DangerButton
} from '@/shared/components/styles';

/**
 * 훈련 상태 타입 정의
 */
type TrainingStatus = 'idle' | 'running' | 'paused' | 'failed' | 'completed' | 'stopped';

/**
 * 실험 제어 컴포넌트
 * 실험 생성, 로드, 실행, 제어 등의 기능을 제공하는 메인 컴포넌트
 */
export default function ExperimentControl() {
  // 모달 상태 관리
  const modals = useMultipleModals(['create', 'load', 'stepInput']);
  const { showSuccess, showError, showWarning, showInfo } = useToastNotification();

  // 실험 상태 관리
  const runId = useExperimentStore((state) => state.runId);
  const setRunId = useExperimentStore((state) => state.setRunId);
  const runName = useExperimentStore((state) => state.runName);
  const setRunName = useExperimentStore((state) => state.setRunName);
  const trainingStatus = useExperimentStore(state => state.trainingStatus);
  const setTrainingStatus = useExperimentStore(state => state.setTrainingStatus);
  const templateId = useExperimentStore(state => state.templateId);
  const templateName = useExperimentStore(state => state.templateName);
  const setCanConnect = useExperimentStore(state => state.setCanConnect);
  
  // URL 동기화를 위한 searchParams
  const [, setSearchParams] = useSearchParams();

  // 실시간 실험 정보 관리
  const setTrainingMetrics = useExperimentStore(state => state.setTrainingMetrics);

  // 비디오 플레이어 실행 상태 확인
  const videoRun = useExperimentStore((state) => state.videoRun);
  const setVideoRun = useExperimentStore((state) => state.setVideoRun);
  
  // 속도 레벨 관리
  const setTrainingSpeedLevel = useExperimentStore((state) => state.setTrainingSpeedLevel);

  /**
   * 실험 상태를 폴링하는 함수
   * @param id - 실험 ID
   * @returns 훈련 상태
   */
  const pollTrainingStatus = async (id: string): Promise<TrainingStatus> => {
    const response = await runsApi.getRunStatus(id);
    if (response.success && response.data?.status) {
      return response.data.status.toLowerCase() as TrainingStatus;
    }
    throw new Error('Failed to get run status');
  };

  // 상태 폴링 훅 사용 (즉시 폴링 함수 반환)
  const triggerStatusPolling = useStatusPolling(
    runId,
    pollTrainingStatus,
    setTrainingStatus,
    () => useExperimentStore.getState().trainingStatus
  );

  /**
   * 시작 버튼 클릭 핸들러
   * 스텝 입력 모달을 열기 전에 중복 실행을 방지
   */
  const handleStartButtonClick = () => {
    if (videoRun || (runId && ['running', 'paused'].includes(trainingStatus))) {
      showWarning("이미 진행 중인 실험이 있습니다. 먼저 종료하거나 완료를 기다려주세요.");
      return;
    }

    modals.openModal('stepInput');
  };

  /**
   * 실험 시작 핸들러
   * @param steps - 총 학습 스텝 수
   */
  const handleStartExperiment = async (steps: number) => {
    modals.closeModal('stepInput');
    
    try {
      setVideoRun(true);
      setCanConnect(true);

      const response = await runsApi.createRun(templateId!, {
        totalSteps: steps 
      });

      setRunName(response.data?.runName || null);
      setRunId(response.data?.runId || null);
      setTrainingMetrics([]);

      showSuccess('실험이 시작되었습니다.');
      ExperimentLogger.start(`실험 시작 성공: ${response.data?.runId}`);

      // URL에 runId 추가
      if (response.data?.runId) {
        setSearchParams({ runId: response.data.runId });
      }

    } catch (error) {
      setVideoRun(false);
      setCanConnect(false);

      ExperimentLogger.error(`실험 시작 실패: ${error}`);
      showError('실험 시작에 실패했습니다.');
    }
  };

  /**
   * 실험 일시정지 핸들러
   */
  const handlePauseExperiment = async () => {
    if (!runId || trainingStatus !== 'running') {
      showWarning("진행 중인 실험이 없거나 이미 일시정지 상태입니다.");
      return;
    }

    try {
      await runsApi.pauseRun(runId);
      
      // 즉시 상태 폴링 실행
      triggerStatusPolling();
      ExperimentLogger.pause(`실험 일시정지: ${runId}`);
      showInfo('실험이 일시정지되었습니다.');

    } catch (error) {
      ExperimentLogger.error(`실험 일시정지 실패: ${error}`);
      showError('실험 일시정지에 실패했습니다.');
    }
  };

  /**
   * 실험 재개 핸들러
   */
  const handleResumeExperiment = async () => {
    if (!runId || trainingStatus !== 'paused') {
      showWarning("일시정지된 실험이 없습니다.");
      return;
    }
    
    try {
      await runsApi.resumeRun(runId);
      
      // 즉시 상태 폴링 실행
      triggerStatusPolling();
      ExperimentLogger.resume(`실험 재개: ${runId}`);
      showInfo('실험이 재개되었습니다.');

    } catch (error) {
      ExperimentLogger.error(`실험 재개 실패: ${error}`);
      showError('실험 재개에 실패했습니다.');
    }
  };

  /**
   * 실험 종료 핸들러
   */
  const handleStopExperiment = async () => {
    if (!runId || !['running', 'paused'].includes(trainingStatus)) {
      showWarning("진행 중인 실험이 없습니다.");
      return;
    }

    const isConfirmed = confirm("정말 실험을 종료하시겠습니까?\n 종료된 실험은 다시 시작할 수 없습니다.");
    if (!isConfirmed) {
      return;
    }

    try {
      await runsApi.stopRun(runId);
      ExperimentLogger.stop(`실험 종료 성공: ${runId}`);

    } catch (error) {
      ExperimentLogger.error(`실험 종료 실패: ${error}`);
      showError('실험 종료에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (trainingStatus === 'stopped' || trainingStatus === 'completed' || trainingStatus === 'failed') {
      handleExperimentEnd();
    }
  }, [trainingStatus]);

  /**
   * 실험 종료 시 처리하는 함수
   * 상태에 따라 적절한 알림을 표시하고 상태를 초기화
   */
  const handleExperimentEnd = () => {
    ExperimentLogger.complete(`실험 종료 - 상태: ${trainingStatus}`);
    
    setVideoRun(false); // 비디오 실행 상태 해제
    setCanConnect(false);
    setTrainingSpeedLevel(2); // 속도 레벨을 기본값으로 초기화

    setTimeout(() => {
      ExperimentLogger.complete('실험 상태 초기화');
      setRunId(null);
      setTrainingStatus('idle');
      setRunName(null);
    }, 5000);

    // 사용자에게 알림
    if (trainingStatus === 'completed') {
      showSuccess('실험이 성공적으로 완료되었습니다!');
      ExperimentLogger.complete('실험 성공!');
    } else if (trainingStatus === 'failed') {
      showError('실험이 실패했습니다.');
      ExperimentLogger.error('실험 실패!');
    } else if (trainingStatus === 'stopped') {
      showWarning('실험이 중단되었습니다.');
      ExperimentLogger.stop('실험 중단!');
    }

    // URL에서 runId 제거
    setSearchParams({});
  };

  /**
   * 실험 상태에 따른 버튼을 렌더링하는 함수
   * @returns 상태에 맞는 버튼 컴포넌트들
   */
  const renderExperimentControls = () => {
    switch (trainingStatus) {
      case 'idle':
      case 'stopped':
      case 'failed':
      case 'completed':
        return (
          <StartButton 
            onClick={handleStartButtonClick}
            disabled={!templateId}
          >
            시작
          </StartButton>
        );

      case 'running':
        return (
          <>
            <ActionButton onClick={handlePauseExperiment}>
              일시정지
            </ActionButton>
            <DangerButton onClick={handleStopExperiment}>
              종료
            </DangerButton>
          </>
        );

      case 'paused':
        return (
          <>
            <StartButton onClick={handleResumeExperiment}>
              재개
            </StartButton>
            <DangerButton onClick={handleStopExperiment}>
              종료
            </DangerButton>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* HeaderSection을 따로 분리 */}
      <HeaderSection>
        <TopBar>
          <ProjectName $hasTemplate={!!templateName}>
            {!templateName
              ? '실험 준비 중'
              : !runName
                ? '실험 대기 중'
                : runName}
          </ProjectName>
          <ButtonGroup>
            <ActionButton 
              onClick={() => modals.openModal('load')}
              disabled={['running', 'paused'].includes(trainingStatus)}
            >
              실험 불러오기
            </ActionButton>
            <ActionButton 
              onClick={() => modals.openModal('create')}
              disabled={['running', 'paused'].includes(trainingStatus)}
            >
              실험 생성
            </ActionButton>

            {/* 실험 상태에 따른 동적 버튼 렌더링 */}
            {renderExperimentControls()}
          </ButtonGroup>
        </TopBar>
      </HeaderSection>

      {/* 모달들을 HeaderSection 밖으로 분리 */}
      {modals.isModalOpen('create') && (
        <TemplateCreateModal onClose={() => modals.closeModal('create')} />
      )}

      {modals.isModalOpen('load') && (
        <TemplateListModal onClose={() => modals.closeModal('load')} />
      )}

      {modals.isModalOpen('stepInput') && (
        <StepSetModal 
          type="training"
          onClose={() => modals.closeModal('stepInput')}
          onConfirm={handleStartExperiment}
        />
      )}
    </>
  );
}