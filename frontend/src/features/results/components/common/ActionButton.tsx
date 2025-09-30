import React, { useState } from 'react';
import { FiDownload, FiFileText, FiTrash2 } from 'react-icons/fi';
import { runsApi } from '@/shared/api/runs';
import { useExperimentStore } from '@/store/experimentStore';
import { DangerButton, SecondaryButton } from '@/shared/components/styles/Button';
import { useToastNotification } from '@/shared/hooks/useToastNotification';
import { ActionButtonContainer } from './ActionButton.styled';

/**
 * 액션 버튼 컴포넌트의 Props 인터페이스
 */
interface ActionButtonsProps {
  /** 모델 다운로드 핸들러 */
  onDownloadModel: (runName: string) => void;
  /** 로그 다운로드 핸들러 */
  onDownloadLogs: (runName: string) => void;
  /** 실험 이름 */
  runName: string;
  /** 실험 ID (선택사항) */
  runId?: string;
  /** 실험 상태 (선택사항) */
  status?: string;
  /** 로딩 상태 (기본값: false) */
  loading?: boolean;
  /** 버튼 너비 (기본값: '100px') */
  buttonWidth?: string;
}

/**
 * 삭제 핸들러 커스텀 훅
 * 실험 삭제 로직과 상태를 관리
 * 
 * @returns 삭제 핸들러 함수와 삭제 중 상태
 */
export const useDeleteHandler = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { showSuccess, showError } = useToastNotification();
  const handleDelete = async (runId: string, runName: string) => {
    if (!runId) return;
    
    // confirm으로 확인
    const confirmed = window.confirm(
      `정말로 "${runName || '이 실험'}"을(를) 삭제하시겠습니까?\n\n` +
      `⚠️ 이 작업은 되돌릴 수 없으며, 실험 데이터와 메트릭이 모두 영구적으로 삭제됩니다.`
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      await runsApi.deleteRun(runId);
      
      // 현재 상태 확인
      const currentState = useExperimentStore.getState();
      const isMainExperiment = currentState.resultRunId === runId;
      
      if (isMainExperiment) {
        // 기준 실험 삭제 시: 모든 상태 초기화
        useExperimentStore.getState().setResultRunId(null);
        useExperimentStore.getState().setResultRunDetailInfo(null);
        useExperimentStore.getState().setResultMetricsData(null);
        useExperimentStore.getState().clearSelectedComparisons();
      } else {
        // 비교 실험 삭제 시: 해당 비교 실험만 제거
        const updatedComparisons = currentState.selectedComparisons.filter(
          comparison => comparison.runId !== runId
        );
        useExperimentStore.getState().setSelectedComparisons(updatedComparisons);
      }
      
      // 모델 테스트에서 해당 런이 선택되어 있다면 모델 테스트 상태도 초기화
      if (currentState.testModelId === runId) {
        useExperimentStore.getState().resetTestModel();
      }
      
      showSuccess('실험이 성공적으로 삭제되었습니다.');
      
    } catch (error) {
      console.error('삭제 실패:', error);
      showError('삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleDelete, isDeleting };
};

/**
 * 액션 버튼 컴포넌트
 * 모델 다운로드, 로그 다운로드, 실험 삭제 버튼을 제공
 * 
 * @param onDownloadModel - 모델 다운로드 핸들러
 * @param onDownloadLogs - 로그 다운로드 핸들러
 * @param runName - 실험 이름
 * @param runId - 실험 ID (선택사항)
 * @param loading - 로딩 상태 (기본값: false)
 * @param status - 실험 상태 (선택사항)
 * @param buttonWidth - 버튼 너비 (기본값: '100px')
 */
export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onDownloadModel, 
  onDownloadLogs, 
  runName,
  runId,
  loading = false,
  status,
  buttonWidth = '100px'
}) => {
  const { handleDelete, isDeleting } = useDeleteHandler();

  return (
    <ActionButtonContainer $buttonWidth={buttonWidth}>
      <SecondaryButton onClick={() => onDownloadModel(runName)} disabled={loading}>
        <FiDownload size={16} />
        모델
      </SecondaryButton>
      <SecondaryButton onClick={() => onDownloadLogs(runName)} disabled={loading}>
        <FiFileText size={16} />
        로그
      </SecondaryButton>
      {runId && (
        <DangerButton 
          onClick={() => handleDelete(runId, runName)} 
          disabled={loading || isDeleting || status === 'RUNNING' || status === 'PAUSED'}
        >
          <FiTrash2 size={16} />
          {isDeleting ? '삭제 중...' : '삭제'}
        </DangerButton>
      )}
    </ActionButtonContainer>
  );
};

/**
 * 기존 호환성을 위한 별칭
 * @deprecated ActionButtons 사용을 권장
 */
export const DownloadButtons = ActionButtons;

export default ActionButtons;