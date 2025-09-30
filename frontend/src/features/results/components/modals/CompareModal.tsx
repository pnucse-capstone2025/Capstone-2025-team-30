import { useState, useEffect } from "react"
import { runsApi } from "@/shared/api"
import { useToastNotification } from "@/shared/hooks"
import { PrimaryButton, SecondaryButton } from "@/shared/components/styles/Button"
import { ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, CloseButton } from "@/shared/components/modals"
import type { RunForResults } from "@/shared/types/results"
import { RunList, RunItem, SelectedCount, RunTitle, RunInfo } from "./CompareModal.styled"

/**
 * 비교 모달 컴포넌트의 Props 인터페이스
 */
interface CompareModalProps {
  onClose: () => void;
  onConfirmComparisons: (selectedRuns: RunForResults[]) => void;
  envName: string;
  baseRunId?: string; // 비교 기준 실험의 runId (목록에서 제외할 실험)
}

/**
 * 비교 모달 컴포넌트
 * 여러 실험을 선택하여 비교할 수 있는 모달
 * 최대 5개까지 선택 가능하며, 비교 기준 실험은 제외
 * 
 * @param onClose - 모달 닫기 콜백 함수
 * @param onConfirmComparisons - 비교 확인 콜백 함수
 * @param envName - 환경 이름
 * @param baseRunId - 비교 기준 실험 ID (선택사항)
 */
const CompareModal = ({ onClose, onConfirmComparisons, envName, baseRunId }: CompareModalProps) => {
  const [runs, setRuns] = useState<RunForResults[]>([]);
  const [selectedRuns, setSelectedRuns] = useState<RunForResults[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useToastNotification();

  // 환경별 실험 목록 로드
  useEffect(() => {
    if (!envName) {
      setRuns([]);
      return;
    }

    const loadRuns = async () => {
      try {
        setLoading(true);
        const response = await runsApi.getRunsByEnvironment(envName);
        if (response.success && response.data?.runs) {
          // 비교 기준 실험을 제외한 목록 생성
          const filteredRuns = response.data.runs
            .filter((run: any) => run.runId !== baseRunId) // 비교 기준 실험 제외
            .map((run: any) => ({
              runId: run.runId,
              runName: run.runName,
              algorithm: run.algName,
              environment: envName,
              status: run.status,
              createdAt: run.createdAt
            }));
          setRuns(filteredRuns);
        } else {
          throw new Error('실험 목록을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('실험 목록 로드 실패:', error);
        showError('실험 목록을 불러오는 중 오류가 발생했습니다.');
        setRuns([]);
      } finally {
        setLoading(false);
      }
    };

    loadRuns();
  }, [envName]);

  /**
   * 런 선택/해제 핸들러
   * 최대 5개까지 선택 가능하며, 이미 선택된 런은 해제
   * 
   * @param run - 선택/해제할 런 정보
   */
  const handleRunToggle = (run: RunForResults) => {
    setSelectedRuns(prev => {
      const isSelected = prev.some(selected => selected.runId === run.runId);
      if (isSelected) {
        // 이미 선택된 경우 제거
        const index = prev.findIndex(selected => selected.runId === run.runId);
        return [...prev.slice(0, index), ...prev.slice(index + 1)];
      } else {
        // 선택되지 않은 경우 - 최대 5개까지만 선택 가능
        if (prev.length >= 5) {
          return prev; // 5개 이상 선택 불가
        }
        return [...prev, run];
      }
    });
  };

  /**
   * 비교 확인 핸들러
   * 선택된 런들을 부모 컴포넌트에 전달하고 모달을 닫음
   */
  const handleConfirm = () => {
    onConfirmComparisons(selectedRuns);
    onClose();
  };

  /**
   * 런 선택 상태 확인 함수
   * 
   * @param run - 확인할 런 정보
   * @returns 선택 여부
   */
  const isRunSelected = (run: RunForResults) => {
    return selectedRuns.some(selected => selected.runId === run.runId);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>비교 런 선택</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <div style={{ marginBottom: '16px', padding: '8px 12px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '14px', color: '#0369a1' }}>
            최대 5개의 런을 선택할 수 있습니다.
          </div>
          <RunList>
            {loading ? (
              <div>로딩 중...</div>
            ) : runs.length === 0 ? (
              <div>런 데이터가 없습니다.</div>
            ) : (
              runs.map((run) => {
                const isSelected = isRunSelected(run);
                const isDisabled = !isSelected && selectedRuns.length >= 5;
                return (
                  <RunItem 
                    key={run.runId} 
                    $isSelected={isSelected}
                    $isDisabled={isDisabled}
                    onClick={() => !isDisabled && handleRunToggle(run)}
                  >
                    <RunTitle>{run.runName}</RunTitle>
                    <RunInfo>
                      알고리즘: {run.algorithm} | 상태: {run.status}
                    </RunInfo>
                    {isDisabled && (
                      <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
                        최대 선택 수에 도달했습니다
                      </div>
                    )}
                  </RunItem>
                );
              })
            )}
          </RunList>
        </ModalBody>

        <ModalFooter>
          <SelectedCount>
            선택된 런: {selectedRuns.length}개
          </SelectedCount>
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
           <PrimaryButton 
             onClick={handleConfirm}
             disabled={selectedRuns.length === 0}
             style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}
           >
             비교 ({selectedRuns.length})
           </PrimaryButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CompareModal;
