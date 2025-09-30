import { useState } from 'react';
import {
  CancelButton,
  SaveButton,
  PrimaryButton
} from '@/shared/components/styles';
import styled from 'styled-components';
import { useExperimentStore } from '@/store/experimentStore';
import { useToastNotification } from '@/shared/hooks';
import { runsApi } from '@/shared/api';

/**
 * 피드백 영역 컴포넌트의 Props 인터페이스
 */
interface FeedbackAreaProps {
  // 현재는 props가 필요하지 않음 - 모든 로직을 내부에서 처리
}

/**
 * 피드백 컨테이너 스타일
 * 피드백 영역을 감싸는 메인 컨테이너
 */
const FeedbackContainer = styled.div`
  flex: 1;
  margin-top: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-2px) scale(1.01);
  }
`;

/**
 * 피드백 입력 텍스트영역 스타일
 * 사용자가 피드백을 입력하는 텍스트 영역
 */
const StyledTextarea = styled.textarea`
  width: 100%;
  height: 150px;
  padding: 12px;
  font-family: inherit;
  box-sizing: border-box;
  border-radius: 4px;
  border: 0px;
  font-size: 18px;
  resize: none;

  &:focus {
    outline: none;
  }
`;

/**
 * 피드백 영역 컴포넌트
 * 사용자가 실험에 대한 피드백을 입력하고 전송할 수 있는 컴포넌트
 * 피드백 모드와 일반 모드를 전환하며 피드백을 관리
 * hf-llm 알고리즘에서만 표시됨
 */
export default function FeedbackArea({}: FeedbackAreaProps) {
  // 실험 관련 상태
  const currentRunId = useExperimentStore(state => state.runId);
  const trainingStatus = useExperimentStore(state => state.trainingStatus);
  
  // 토스트 알림 함수들
  const { showSuccess, showError, showWarning, showInfo } = useToastNotification();
  
  // 피드백 모드 상태
  const [feedbackMode, setFeedbackMode] = useState(false);
  // 피드백 텍스트 상태
  const [feedbackText, setFeedbackText] = useState('');

  /**
   * 피드백 시작 핸들러
   * 실험을 일시정지하고 피드백 모드로 전환
   */
  const handleStartFeedback = async () => {
    if (!currentRunId) {
      showWarning("진행 중인 실험이 없습니다.");
      return;
    }
    if (trainingStatus === 'paused') {
      return;
    }
    if (trainingStatus !== 'running') {
      showError("잘못된 실험 상태입니다.");
      return;
    }

    try {
      await runsApi.pauseRun(currentRunId);
      showInfo('실험이 일시정지되었습니다.');
      setFeedbackMode(true);
    } catch (error) {
      console.error('실험 일시정지 실패:', error);
      showError('실험 일시정지에 실패했습니다.');
    }
  };

  /**
   * 피드백 전송 핸들러
   * 사용자가 입력한 피드백을 서버로 전송
   */
  const handleSendFeedback = async () => {
    if (!currentRunId) {
      showWarning("진행 중인 실험이 없습니다.");
      return;
    }

    try {
      await runsApi.sendFeedback(currentRunId, { text: feedbackText });
      showSuccess('피드백이 전송되었습니다.');
      setFeedbackMode(false);
      setFeedbackText('');
    } catch (error) {
      console.error('피드백 전송 실패:', error);
      showError('피드백 전송에 실패했습니다.');
    }
  };

  /**
   * 피드백 취소 핸들러
   * 피드백 모드를 종료하고 실험을 재개
   */
  const handleCancel = async () => {
    if (!currentRunId) {
      showWarning("진행 중인 실험이 없습니다.");
      return;
    }
    if (trainingStatus !== 'paused') {
      showWarning("일시정지된 실험이 없습니다.");
      return;
    }
    
    try {
      await runsApi.resumeRun(currentRunId);
      showInfo('실험이 재개되었습니다.');
      setFeedbackMode(false);
      setFeedbackText('');
    } catch (error) {
      console.error('실험 재개 실패:', error);
      showError('실험 재개에 실패했습니다.');
    }
  };

  return (
    <FeedbackContainer>
      {!feedbackMode ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <PrimaryButton onClick={handleStartFeedback}>
            피드백 시작
          </PrimaryButton>
        </div>
      ) : (
        <form
          onSubmit={event => {
            event.preventDefault();
            handleSendFeedback();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <StyledTextarea
            id="feedback-input"
            value={feedbackText}
            onChange={event => setFeedbackText(event.target.value)}
            placeholder="피드백 내용을 입력하세요."
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: '12px' }}>
            <CancelButton onClick={handleCancel}>
              취소
            </CancelButton>
            <SaveButton type="submit">
              전송
            </SaveButton>
          </div>
        </form>
      )}
    </FeedbackContainer>
  );
}