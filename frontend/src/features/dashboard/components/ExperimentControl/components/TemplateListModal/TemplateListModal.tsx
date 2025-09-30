import { useState, useEffect } from 'react';
import { useExperimentStore } from '@/store/experimentStore';
import { useToastNotification } from '@/shared/hooks';
import { templatesApi } from '@/shared/api';
import type { Template } from '@/shared/api/types';
import { UILogger } from '@/shared/utils/logger';
import { formatDate } from '@/shared/utils/dateUtils';
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
import { PrimaryButton, DangerButton } from '@/shared/components/styles';
import {
  EmptyWrap,
  EmptyTitle,
  EmptySub
} from '@/shared/components/ui/EmptyState';

/**
 * 템플릿 목록 모달 컴포넌트
 * 사용자가 생성된 템플릿 목록을 확인하고 선택할 수 있는 모달입니다.
 * 
 * @param onClose - 모달 닫기 함수
 */
export default function TemplateListModal({ onClose }: { onClose: () => void }) {
  // 템플릿 목록 상태
  const [templates, setTemplates] = useState<Template[]>([]);
  // 로딩 상태
  const [loading, setLoading] = useState(true);
  // 템플릿 ID 설정 함수
  const setTemplateId = useExperimentStore((state) => state.setTemplateId);
  // 토스트 알림 함수들
  const { showInfo, showError } = useToastNotification();

  /**
   * 템플릿 목록을 조회하는 함수
   */
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await templatesApi.getTemplates();
      UILogger.action('템플릿 목록 조회 성공', { count: response.data?.templates?.length || 0 });
      setTemplates(response.data?.templates ?? []);
    } catch (error) {
      UILogger.error('TemplateListModal', `Error fetching templates: ${error}`);
      showError('실험 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  /**
   * 템플릿 선택 핸들러
   * @param id - 선택된 템플릿의 ID
   */
  const handleSelectTemplate = async (id: string) => {
    if (!id) {
      UILogger.error('TemplateListModal', 'Template ID is undefined');
      return;
    }
    
    UILogger.action('템플릿 선택', { templateId: id });

    setTemplateId(id);
    showInfo('실험을 불러왔습니다.');
    onClose();
  };

  /**
   * 템플릿 삭제 핸들러
   * @param id - 삭제할 템플릿의 ID
   */
  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await templatesApi.deleteTemplate(id);
      fetchTemplates(); // 삭제 후 목록 갱신

      const currentTemplateId = useExperimentStore.getState().templateId;
      if (currentTemplateId === id) { // 전역 상태 id와 비교
        setTemplateId(null);
      }
      
      showInfo('실험이 삭제되었습니다.');
    } catch (error) {
      UILogger.error('TemplateListModal', `Error deleting template: ${error}`);
      showError('실험 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={event => event.stopPropagation()}>
        <ModalHeader>
          <h2>실험 불러오기</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          {loading ? (
            <LoadingContainer>불러오는 중...</LoadingContainer>
          ) : templates.length === 0 ? (
            <EmptyWrap>
              <EmptyTitle>저장된 실험이 없습니다.</EmptyTitle>
              <EmptySub>상단의 <b>실험 생성</b>을 통해 실험을 만들어주세요.</EmptySub>
            </EmptyWrap>
          ) : (
            <TemplateList>
              {templates.map((template, index) => {
                // API Template 타입에는 id 속성만 있음
                const templateId = template.id;
                const safeKey = templateId || `template-${index}`;
                
                if (!templateId) {
                  UILogger.error('TemplateListModal', `Template missing ID: ${JSON.stringify(template)}`);
                  return null;
                }
                
                return (
                  <TemplateItem key={safeKey} onClick={() => handleSelectTemplate(templateId)}>
                    <TemplateHeader>
                      <TemplateName>{template.name || '이름 없음'}</TemplateName>
                      <InfoContainer>
                        <InfoItem>{template.envName}</InfoItem>
                        <InfoItem>{template.algName}</InfoItem>
                        {template.createdAt && (
                          <InfoItem>{formatDate(template.createdAt)}</InfoItem>
                        )}
                      </InfoContainer>
                    </TemplateHeader>
                    <TemplateActions onClick={(event) => event.stopPropagation()}>
                      <PrimaryButton onClick={() => handleSelectTemplate(templateId)}>
                        불러오기
                      </PrimaryButton>
                      <DangerButton onClick={() => handleDeleteTemplate(templateId)}>
                        삭제
                      </DangerButton>
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