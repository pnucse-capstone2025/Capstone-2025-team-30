import { useState, useEffect } from 'react';
import { useExperimentStore } from '@/store/experimentStore';
import { useToastNotification } from '@/shared/hooks';
import { modelsApi } from '@/shared/api';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  TemplateList,
  TemplateItem,
  TemplateHeader,
  TemplateName,
  TemplateActions,
  InfoContainer,
  InfoItem,
  LoadingContainer
} from '@/shared/components/modals';
import { StatusBadge } from '@/shared/components';
import { PrimaryButton } from '@/shared/components/styles';
import { UILogger } from '@/shared/utils/logger';
import { formatDate } from '@/shared/utils/dateUtils';
import {
  EmptyWrap,
  EmptyTitle,
  EmptySub
} from '@/shared/components/ui/EmptyState';

/**
 * 테스트 모델 목록 모달 컴포넌트의 Props 인터페이스
 */
interface TestModelListModalProps {
  /** 모달 닫기 콜백 함수 */
  onClose: () => void;
}

/**
 * 테스트 모델 목록을 표시하고 선택할 수 있는 모달 컴포넌트
 * 저장된 모델 목록을 조회하고 사용자가 테스트할 모델을 선택할 수 있음
 * 
 * @param onClose - 모달 닫기 함수
 */
export default function TestModelListModal({ onClose }: TestModelListModalProps) {
  // 테스트 모델 목록 상태
  const [testModels, setTestModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 전역 상태 관리
  const setTestModelDetailInfo = useExperimentStore((state) => state.setTestModelDetailInfo);
  const setTestModelId = useExperimentStore((state) => state.setTestModelId);
  
  // 알림 훅
  const { showError, showInfo } = useToastNotification();

  /**
   * 테스트 모델 목록을 조회하는 함수
   * API를 통해 저장된 모든 테스트 모델 목록을 가져옴
   */
  const fetchTestModels = async () => {
    setIsLoading(true);
    try {
      const response = await modelsApi.getModels();
      UILogger.action('테스트 모델 목록 조회', { count: response.data?.runs?.length || 0 });
      setTestModels(response.data?.runs ?? []);
    } catch (error) {
      UILogger.error('TestModelListModal', `Error fetching test models: ${error}`);
      showError('테스트 모델 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTestModels();
  }, []);

  /**
   * 테스트 모델 선택 핸들러
   * 선택된 모델의 상세 정보를 조회하고 전역 상태에 저장
   * @param modelId - 선택된 테스트 모델의 ID
   */
  const handleSelectTestModel = async (modelId: string) => {
    if (!modelId) {
      UILogger.error('TestModelListModal', 'Test model ID is undefined');
      return;
    }
    
    UILogger.action('테스트 모델 선택', { modelId });
    
    try {
      const response = await modelsApi.getModel(modelId);
      UILogger.action('테스트 모델 데이터 조회', { modelId });
      
      if (response.data?.run) {
        const modelData = response.data.run;
        
        // 통합된 테스트 모델 상세 정보 설정
        setTestModelDetailInfo({
          runId: modelData.runId,
          runName: modelData.runName,
          envName: modelData.envName,
          envConfig: modelData.envConfig || {},
          algName: modelData.algName,
          algConfig: modelData.algConfig || {},
          createdAt: modelData.createdAt,
          status: modelData.status
        });
        
        // 테스트 모델 ID도 별도로 설정
        setTestModelId(modelData.runId);
        showInfo('테스트 모델을 불러왔습니다.');
        onClose(); // 모달 닫기
      }
    } catch (error) {
      UILogger.error('TestModelListModal', `Error selecting test model: ${error}`);
      showError('테스트 모델을 불러오는 중 오류가 발생했습니다.');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <h2>테스트 모델 불러오기</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {isLoading ? (
            <LoadingContainer>불러오는 중...</LoadingContainer>
          ) : testModels.length === 0 ? (
            <EmptyWrap>
              <EmptyTitle>저장된 모델이 없습니다.</EmptyTitle>
              <EmptySub>대시보드에서 <b>실험</b>을 진행하여 모델을 생성해주세요.</EmptySub>
            </EmptyWrap>
          ) : (
            <TemplateList>
              {testModels.map((model, index) => {
                // API에서 runId 필드를 사용
                const modelId = model.runId;
                const safeKey = modelId || `model-${index}`;
                
                if (!modelId) {
                  UILogger.error('TestModelListModal', `Test model missing ID: ${JSON.stringify(model)}`);
                  return null;
                }
                
                return (
                  <TemplateItem key={safeKey}>
                    <TemplateHeader>
                      <TemplateName>{model.runName || '이름 없음'}</TemplateName>
                      <InfoContainer>
                        <InfoItem>{model.envName?.toUpperCase() || '-'}</InfoItem>
                        <InfoItem>{model.algName?.toUpperCase() || '-'}</InfoItem>
                        {model.createdAt && (
                          <InfoItem>{formatDate(model.createdAt)}</InfoItem>
                        )}
                        {model.status && (
                          <StatusBadge status={model.status} />
                        )}
                      </InfoContainer>
                    </TemplateHeader>
                    <TemplateActions>
                      <PrimaryButton 
                        onClick={() => handleSelectTestModel(modelId)} 
                        disabled={model.status === 'FAILED'}
                      >
                        불러오기
                      </PrimaryButton>
                    </TemplateActions>
                  </TemplateItem>
                );
              })}
            </TemplateList>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}