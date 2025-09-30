import { useEffect } from "react";
import { useExperimentStore } from "@/store/experimentStore";
import { useModalState, useStatusPolling, useToastNotification } from "@/shared/hooks";
import { modelsApi } from "@/shared/api";
import { UILogger } from "@/shared/utils/logger";
import TestModelListModal from "@/features/model-test/components/TestControl/components/TestModelListModal";
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
 * 테스트 상태 타입 정의
 */
type TestStatus = 'invalid' | 'idle' | 'testing' | 'paused' | 'completed';

/**
 * 테스트 모델 제어 컴포넌트
 * 테스트 모델을 불러오고, 시작/일시정지/재개/종료 등의 기능을 제공
 */
export default function TestModelControl() {
  /* ===== 모달 상태 관리 ===== */
  const loadModal = useModalState();
  const { showSuccess, showError, showWarning, showInfo } = useToastNotification();
  const stepInputModal = useModalState();

  /* ===== 테스트 모델 상태 관리 ===== */
  const testModelName = useExperimentStore((state) => state.testModelDetailInfo?.runName);
  const testModelId = useExperimentStore((state) => state.testModelId);
  const testingStatus = useExperimentStore(state => state.testingStatus);
  const setTestingStatus = useExperimentStore(state => state.setTestingStatus);
  const resetTestModel = useExperimentStore(state => state.resetTestModel);

  // 비디오 플레이어 실행 상태 확인
  const videoRun = useExperimentStore((state) => state.videoRun);
  const setVideoRun = useExperimentStore((state) => state.setVideoRun);

  /**
   * 테스트 모델 상태를 폴링하는 함수
   * @param modelId - 테스트 모델 ID
   * @returns 테스트 상태
   */
  const pollTestModelStatus = async (modelId: string): Promise<TestStatus> => {
    const response = await modelsApi.getModelStatus(modelId);
    const status = response.data?.testStatus?.toLowerCase() as TestStatus;
    return status;
  };

  // 상태 폴링 훅 사용 (즉시 폴링 함수 반환)
  const triggerStatusPolling = useStatusPolling(
    testModelId,
    pollTestModelStatus,
    setTestingStatus,
    () => useExperimentStore.getState().testingStatus
  );

  /**
   * 테스트 시작 버튼 클릭 핸들러
   * 스텝 입력 모달을 열기 전에 중복 실행을 방지
   */
  const handleStartButtonClick = () => {
    if (videoRun) {
      showWarning("다른 실험이나 테스트가 진행 중입니다.");
      return;
    }
    
    if (!testModelId) {
      showWarning("테스트 모델을 먼저 선택해주세요.");
      return;
    }

    if (testModelId && ['testing', 'paused'].includes(testingStatus)) {
      showWarning("이미 진행 중인 테스트가 있습니다.");
      return;
    }

    stepInputModal.openModal();
  };

  /**
   * 테스트 모델 시작 핸들러
   * @param testCount - 테스트 횟수
   */
  const handleStartTestModel = async (testCount: number) => {
    stepInputModal.closeModal();
    
    try {
      setVideoRun(true); // 비디오 실행 시작
      
      await modelsApi.startModelTest(testModelId!, { episodesnum: testCount });
      UILogger.action('테스트 시작 성공', { modelId: testModelId, testCount });
      
      // 즉시 상태 폴링 실행
      triggerStatusPolling();
      showSuccess('테스트가 시작되었습니다.');

    } catch (error) {
      UILogger.error('TestModelControl', `테스트 시작 실패: ${error}`);
      setVideoRun(false); // 실패 시 비디오 실행 상태 해제
      showError('테스트 시작에 실패했습니다.');
    }
  };

  /**
   * 테스트 일시정지 핸들러
   */
  const handlePauseTestModel = async () => {
    if (!testModelId || testingStatus !== 'testing') {
      showWarning("진행 중인 테스트가 없거나 이미 일시정지 상태입니다.");
      return;
    }

    try {
      await modelsApi.pauseModelTest(testModelId);
      UILogger.action('테스트 일시정지 성공', { modelId: testModelId });

      // 즉시 상태 폴링 실행
      triggerStatusPolling();
      showInfo('테스트가 일시정지되었습니다.');

    } catch (error) {
      UILogger.error('TestModelControl', `테스트 일시정지 실패: ${error}`);
      showError('테스트 일시정지에 실패했습니다.');
    }
  };

  /**
   * 테스트 재개 핸들러
   */
  const handleResumeTestModel = async () => {
    if (!testModelId || testingStatus !== 'paused') {
      showWarning("일시정지된 테스트가 없습니다.");
      return;
    }
    
    try {
      await modelsApi.resumeModelTest(testModelId);
      UILogger.action('테스트 재개 성공', { modelId: testModelId });

      // 즉시 상태 폴링 실행
      triggerStatusPolling();
      showInfo('테스트가 재개되었습니다.');
    } catch (error) {
      UILogger.error('TestModelControl', `테스트 재개 실패: ${error}`);
      showError('테스트 재개에 실패했습니다.');
    }
  };

  /**
   * 테스트 종료 핸들러
   */
  const handleStopTestModel = async () => {
    if (!testModelId) {
      showWarning("진행 중인 테스트가 없습니다.");
      return;
    }

    const isConfirmed = confirm("정말 테스트를 종료하시겠습니까?");
    if (!isConfirmed) {
      return;
    }

    try {
      await modelsApi.stopModelTest(testModelId);
      UILogger.action('테스트 종료 성공', { modelId: testModelId });
      
      // 즉시 상태 폴링 실행
      triggerStatusPolling();

    } catch (error) {
      UILogger.error('TestModelControl', `테스트 종료 실패: ${error}`);
      showError('테스트 종료에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (testingStatus === 'completed' && testModelId) {
      handleTestModelEnd();
    }
  }, [testingStatus, testModelId]);

  /**
   * 테스트 종료 시 처리하는 함수
   * 상태에 따라 적절한 알림을 표시하고 상태를 초기화
   */
  const handleTestModelEnd = () => {
    UILogger.action('테스트 종료', { status: testingStatus });
    
    setVideoRun(false); // 비디오 실행 상태 해제

    // WebRTC 연결 해제는 별도 처리

    setTimeout(() => {
      UILogger.action('테스트 상태 초기화');
      resetTestModel();
    }, 5000);

    // 사용자에게 알림
    showSuccess("테스트가 종료되었습니다.");
  };

  /**
   * 테스트 상태에 따른 버튼을 렌더링하는 함수
   * @returns 상태에 맞는 버튼 컴포넌트들
   */
  const renderTestModelControls = () => {
    switch (testingStatus) {
      case 'invalid':
      case 'completed':
      case 'idle':
        return (
          <StartButton 
            onClick={handleStartButtonClick}
            disabled={!testModelId}
          >
            시작
          </StartButton>
        );

      case 'testing':
        return (
          <>
            <ActionButton onClick={handlePauseTestModel}>
              일시정지
            </ActionButton>
            <DangerButton onClick={handleStopTestModel}>
              종료
            </DangerButton>
          </>
        );

      case 'paused':
        return (
          <>
            <StartButton onClick={handleResumeTestModel}>
              재개
            </StartButton>
            <DangerButton onClick={handleStopTestModel}>
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
      <HeaderSection>
        <TopBar>
          <ProjectName $hasTemplate={!!testModelName}>
            {!testModelName ? '테스트 준비 중' : testModelName}
          </ProjectName>
          <ButtonGroup>
            <ActionButton 
              onClick={loadModal.openModal}
              disabled={['testing', 'paused'].includes(testingStatus)}
            >
              모델 불러오기
            </ActionButton>
            {renderTestModelControls()}
          </ButtonGroup>
        </TopBar>
      </HeaderSection>

      {/* HeaderSection 아래로 모달 이동 */}
      {loadModal.isOpen && (
        <TestModelListModal onClose={loadModal.closeModal} />
      )}

      {stepInputModal.isOpen && (
        <StepSetModal 
          type="testing"
          onClose={stepInputModal.closeModal}
          onConfirm={handleStartTestModel}
        />
      )}
    </>
  );
}