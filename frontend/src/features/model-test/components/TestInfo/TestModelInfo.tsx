import { useExperimentStore } from '@/store/experimentStore';
import { HoverCard } from '@/shared/components/ui/Card';
import type { JSX } from 'react';
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
import { ParameterNavigator } from "@/shared/components/ui/ParameterNavigator";
import TestModelOverview from './components/TestModelOverview';

/**
 * 테스트 모델 정보 컴포넌트
 * 선택된 테스트 모델의 상세 정보를 표시하는 메인 컴포넌트
 * 모델 개요와 파라미터 정보를 카드 형태로 구성하여 보여줌
 * 
 * @returns JSX.Element
 */
export default function TestModelInfo(): JSX.Element {
  // 전역 상태에서 테스트 모델 상세 정보 가져오기
  const testModelDetailInfo = useExperimentStore((state) => state.testModelDetailInfo);
  
  // 모델 설정 유효성 검사 - 환경 이름이 있으면 유효한 설정으로 간주
  const hasConfig = !!testModelDetailInfo?.envName;

  return (
    <PanelRoot>
      {hasConfig ? (
        <ScrollArea>
          <InfoGrid>
            {/* 모델 개요 카드 */}
            <HoverCard title="모델 개요">
              <TestModelOverview />
            </HoverCard>

            {/* 파라미터 카드 */}
            <HoverCard title="">
              <ParameterNavigator
                envConfig={testModelDetailInfo?.envConfig}
                algConfig={testModelDetailInfo?.algConfig}
                showSlideAnimation={true}
              />
            </HoverCard>
          </InfoGrid>
        </ScrollArea>
      ) : (
        <HoverCard title="모델 개요">
          <EmptyWrap>
            <EmptyTitle>모델이 선택되지 않았습니다.</EmptyTitle>
            <EmptySub> <b>모델 불러오기</b>를 통해 저장된 모델을 선택해주세요.</EmptySub>
          </EmptyWrap>
        </HoverCard>
      )}
    </PanelRoot>
  );
}