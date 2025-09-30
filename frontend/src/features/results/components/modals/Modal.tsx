import { useState, useEffect } from "react"
import { environmentsApi, runsApi } from "@/shared/api"
import { useToastNotification } from "@/shared/hooks"
import { formatDate } from "@/shared/utils/dateUtils"
import { SecondaryButton, PrimaryButton } from "@/shared/components/styles/Button"
import { 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  CloseButton,
  TemplateList,
  TemplateItem,
  TemplateHeader,
  TemplateName,
  TemplateActions,
  InfoContainer,
  InfoItem,
  LoadingContainer
} from "@/shared/components/modals"
import { StatusBadge } from "@/shared/components"
import type { RunForResults } from "@/shared/types/results"
import { EnvironmentList, EnvironmentButton } from "./Modal.styled"


/**
 * 환경 정보 인터페이스
 */
interface Environment {
  name: string;
}

/**
 * 모달 컴포넌트의 Props 인터페이스
 */
interface ModalProps {
  onClose: () => void;
  onSelectRun: (run: RunForResults) => void;
}

/**
 * 런 선택 모달 컴포넌트
 * 환경을 선택하고 해당 환경의 런 목록에서 실험을 선택할 수 있는 모달
 * 
 * @param onClose - 모달 닫기 콜백 함수
 * @param onSelectRun - 런 선택 콜백 함수
 */
const Modal = ({ onClose, onSelectRun }: ModalProps) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnv, setSelectedEnv] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunForResults[]>([]);
  const [loading, setLoading] = useState(false);
  const { showError } = useToastNotification();

  // 환경 목록 로드
  useEffect(() => {
    const loadEnvironments = async () => {
      try {
        setLoading(true);
        const response = await environmentsApi.getEnvironments();
        if (response.success && response.data?.environments) {
          const envList = response.data.environments.map((name: string) => ({ name }));
          setEnvironments(envList);
        } else {
          throw new Error('환경 목록을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('환경 목록 로드 실패:', error);
        showError('환경 목록을 불러오는 중 오류가 발생했습니다.');
        // fallback
        setEnvironments([{name:"Car"},{name:"Ball"}]);
      } finally {
        setLoading(false);
      }
    };

    loadEnvironments();
  }, []); // showError를 dependency에서 제거

  // 선택된 환경의 실험 목록 로드
  useEffect(() => {
    if (!selectedEnv) {
      setRuns([]);
      return;
    }

    const loadRuns = async () => {
      try {
        setLoading(true);
        const response = await runsApi.getRunsByEnvironment(selectedEnv);
        if (response.success && response.data?.runs) {
          setRuns(response.data.runs.map((run: any) => ({
            runId: run.runId,
            runName: run.runName,
            algorithm: run.algName,
            environment: selectedEnv,
            status: run.status,
            createdAt: run.createdAt
          })));
        } else {
          throw new Error('런 목록을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('런 목록 로드 실패:', error);
        showError('런 목록을 불러오는 중 오류가 발생했습니다.');
        setRuns([]);
      } finally {
        setLoading(false);
      }
    };

    loadRuns();
  }, [selectedEnv]); // showError를 dependency에서 제거

  /**
   * 런 선택 핸들러
   * 선택된 런을 부모 컴포넌트에 전달하고 모달을 닫음
   * 
   * @param run - 선택된 런 정보
   */
  const handleRunSelect = (run: RunForResults) => {
    onSelectRun(run);
    onClose();
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>결과 확인할 런 선택</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <EnvironmentList>
            <h4>환경 선택</h4>
            {environments.map((env) => (
              <EnvironmentButton
                key={env.name}
                onClick={() => setSelectedEnv(env.name)}
                style={{
                  backgroundColor: selectedEnv === env.name ? '#111' : '#f8f9fa',
                  color: selectedEnv === env.name ? 'white' : '#333'
                }}
              >
                {env.name.toUpperCase()}
              </EnvironmentButton>
            ))}
          </EnvironmentList>

          {selectedEnv && (
            <TemplateList>
              {loading ? (
                <LoadingContainer>로딩 중...</LoadingContainer>
              ) : runs.length === 0 ? (
                <div>런 데이터가 없습니다.</div>
              ) : (
                runs.map((run, index) => {
                  const safeKey = run.runId || `run-${index}`;
                  
                  if (!run.runId) {
                    return null;
                  }
                  
                  return (
                    <TemplateItem key={safeKey}>
                      <TemplateHeader>
                        <TemplateName>{run.runName || '이름 없음'}</TemplateName>
                        <InfoContainer>
                          <InfoItem>{run.environment?.toUpperCase() || '-'}</InfoItem>
                          <InfoItem>{run.algorithm?.toUpperCase() || '-'}</InfoItem>
                          {run.createdAt && (
                            <InfoItem>{formatDate(run.createdAt)}</InfoItem>
                          )}
                          {run.status && (
                            <StatusBadge status={run.status} />
                          )}
                        </InfoContainer>
                      </TemplateHeader>
                      <TemplateActions>
                        <PrimaryButton onClick={() => handleRunSelect(run)}>
                          선택
                        </PrimaryButton>
                      </TemplateActions>
                    </TemplateItem>
                  );
                })
              )}
            </TemplateList>
          )}
        </ModalBody>

        <ModalFooter>
          <SecondaryButton onClick={onClose}>닫기</SecondaryButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default Modal;