import { useEffect, useState } from 'react';
import { useExperimentStore } from '@/store/experimentStore';
import { templatesApi } from '@/shared/api';
import { HoverCard } from '@/shared/components/ui/Card';
import {
  EmptyWrap,
  EmptyTitle,
  EmptySub
} from '@/shared/components/ui/EmptyState';
import {
  PanelRoot,
  ScrollArea
} from '@/shared/components/styles';
import { InfoGrid } from '@/shared/components/styles/OverviewInfo';
import TemplateOverview from './components/TemplateOverview';
import TemplateNote from './components/TemplateNote';
import { ParameterNavigator } from "@/shared/components/ui/ParameterNavigator";
import { UILogger } from '@/shared/utils/logger';

/**
 * 실험 정보 컴포넌트
 * 선택된 템플릿의 상세 정보를 표시하는 메인 컴포넌트
 * 템플릿 개요, 파라미터, 노트 등의 정보를 포함
 */
export default function ExperimentInfo() {
  // 로딩 상태
  const [loading, setLoading] = useState(false);

  // 템플릿 관련 상태
  const templateId = useExperimentStore((state) => state.templateId);
  const templateConfig = useExperimentStore((state) => state.templateConfig);
  const setTemplateData = useExperimentStore((state) => state.setTemplateData);
  const resetTemplate = useExperimentStore((state) => state.resetTemplate);

  /**
   * 템플릿 데이터를 가져오는 함수
   * @param id - 템플릿 ID
   */
  const fetchTemplateData = async (id: string) => {
    setLoading(true);
    try {
      UILogger.action('템플릿 데이터 조회 시작', { templateId: id });
      const response = await templatesApi.getTemplate(id);
      
      if (response.data?.template) {
        const template = response.data.template;
        UILogger.action('템플릿 데이터 조회 성공', { templateId: id, templateName: template.name });
        
        // 전역 상태에 저장
        setTemplateData({
          id: template.id,
          name: template.name || '',
          note: template.note || '',
          algName: template.algName || '',
          envName: template.envName || '',
          algConfig: template.algConfig || {},
          envConfig: template.envConfig || {},
          createdAt: template.createdAt || ''
        });
      } else {
        UILogger.error('ExperimentInfo', 'No template data received');
        resetTemplate();
      }
    } catch (error) {
      UILogger.error('ExperimentInfo', `Error fetching template data: ${error}`);
      resetTemplate();
    } finally {
      setLoading(false);
    }
  };

  // 템플릿 ID 변경 시 데이터 로드
  useEffect(() => {
    if (!templateId) {
      resetTemplate();
      return;
    }

    fetchTemplateData(templateId);
  }, [templateId, setTemplateData, resetTemplate]);


  // 템플릿 설정 유효성 검사
  const hasConfig = templateConfig && templateConfig.envName && templateConfig.algName;

  // 로딩 상태 렌더링
  if (loading) {
    return (
      <PanelRoot>
        <HoverCard title="실험 정보">
          <EmptyWrap>
            <EmptyTitle>템플릿 정보를 불러오는 중...</EmptyTitle>
          </EmptyWrap>
        </HoverCard>
      </PanelRoot>
    );
  }

  return (
    <PanelRoot>
      {hasConfig ? (
        <ScrollArea>
          <InfoGrid>
            {/* 템플릿 개요 카드 */}
            <HoverCard title="실험 개요">
              <TemplateOverview />
            </HoverCard>

            {/* 파라미터 카드 */}
            <HoverCard title="">
              <ParameterNavigator
                envConfig={templateConfig?.envConfig}
                algConfig={templateConfig?.algConfig}
                showSlideAnimation={true}
              />
            </HoverCard>

            {/* 템플릿 노트 카드 */}
            <HoverCard>
              <TemplateNote />
            </HoverCard>
          </InfoGrid>
        </ScrollArea>
      ) : (
        <HoverCard title="실험 개요">
          <EmptyWrap>
            <EmptyTitle>실험이 선택되지 않았습니다.</EmptyTitle>
            <EmptySub> <b>실험 생성</b> 또는 <b>실험 불러오기</b>를 통해 진행할 실험을 선택해주세요.</EmptySub>
          </EmptyWrap>
        </HoverCard>
      )}
    </PanelRoot>
  );
}