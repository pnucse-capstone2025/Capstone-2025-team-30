import React, { useState } from 'react';
import {
  EmptyWrap,
  EmptyTitle
} from '@/shared/components/ui/EmptyState';
import { ParametersList } from '@/shared/components/ui/ParameterList';
import {
  ParameterCard,
  NavigationHeader,
  NavigationButton,
  ParameterTitle,
  ParameterIndicator,
  IndicatorDot,
  SlideContainer,
  SlideWrapper,
  SlideContent
} from './ParameterNavigator.styled';

interface ParameterNavigatorProps {
  envConfig: Record<string, any> | null;
  algConfig: Record<string, any> | null;
  showSlideAnimation?: boolean;
  envTitle?: string;
  algTitle?: string;
  envEmptyMessage?: string;
  algEmptyMessage?: string;
}

/**
 * 파라미터 네비게이터 컴포넌트
 * 환경 설정과 알고리즘 설정 파라미터를 슬라이드 네비게이션으로 표시
 * @param envConfig - 환경 설정 객체
 * @param algConfig - 알고리즘 설정 객체
 * @param showSlideAnimation - 슬라이드 애니메이션 표시 여부 (기본값: true)
 * @param envTitle - 환경 설정 제목 (기본값: "환경 설정 값")
 * @param algTitle - 알고리즘 설정 제목 (기본값: "알고리즘 설정 값")
 * @param envEmptyMessage - 환경 설정이 없을 때 메시지
 * @param algEmptyMessage - 알고리즘 설정이 없을 때 메시지
 */

const ParameterNavigator: React.FC<ParameterNavigatorProps> = ({
  envConfig,
  algConfig,
  showSlideAnimation = true,
  envTitle = "환경 설정 값",
  algTitle = "알고리즘 설정 값",
  envEmptyMessage = "현재 설정된 환경 설정 값이 없습니다.",
  algEmptyMessage = "현재 설정된 알고리즘 설정 값이 없습니다."
}) => {
  const [currentParameterView, setCurrentParameterView] = useState<'env' | 'alg'>('env');

  const envEntries = envConfig ? Object.entries(envConfig) : [];
  const algEntries = algConfig ? Object.entries(algConfig) : [];
  const hasEnvParams = envEntries.length > 0;
  const hasAlgParams = algEntries.length > 0;

  /**
   * 이전 파라미터 뷰로 전환하는 핸들러
   */
  const handlePrevious = () => {
    setCurrentParameterView(current => current === 'env' ? 'alg' : 'env');
  };

  /**
   * 다음 파라미터 뷰로 전환하는 핸들러
   */
  const handleNext = () => {
    setCurrentParameterView(current => current === 'env' ? 'alg' : 'env');
  };

  // 둘 다 비어있으면 빈 상태 표시
  if (!hasEnvParams && !hasAlgParams) {
    return (
      <EmptyWrap>
        <EmptyTitle>설정된 파라미터가 없습니다.</EmptyTitle>
      </EmptyWrap>
    );
  }

  // 둘 중 하나만 있으면 네비게이션 없이 표시
  if (hasEnvParams && !hasAlgParams) {
    return (
      <ParametersList
        title={envTitle}
        paramEntries={envEntries}
        ariaLabel="Environment parameters"
      />
    );
  }

  if (!hasEnvParams && hasAlgParams) {
    return (
      <ParametersList
        title={algTitle}
        paramEntries={algEntries}
        ariaLabel="Algorithm parameters"
      />
    );
  }

  // 둘 다 있으면 네비게이션과 함께 표시
  return (
    <ParameterCard>
      <NavigationHeader>
        <NavigationButton onClick={handlePrevious}>
          ←
        </NavigationButton>
        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          <ParameterTitle>
            {currentParameterView === 'env' ? envTitle : algTitle}
          </ParameterTitle>
          <ParameterIndicator>
            <IndicatorDot $active={currentParameterView === 'env'} />
            <IndicatorDot $active={currentParameterView === 'alg'} />
          </ParameterIndicator>
        </div>
        <NavigationButton onClick={handleNext}>
          →
        </NavigationButton>
      </NavigationHeader>
      
      {showSlideAnimation ? (
        <SlideContainer>
          <SlideWrapper $currentView={currentParameterView}>
            <SlideContent>
              <ParametersList
                title=""
                paramEntries={envEntries}
                ariaLabel="Environment parameters"
              />
            </SlideContent>
            <SlideContent>
              <ParametersList
                title=""
                paramEntries={algEntries}
                ariaLabel="Algorithm parameters"
              />
            </SlideContent>
          </SlideWrapper>
        </SlideContainer>
      ) : (
        // 슬라이드 애니메이션 없이 즉시 전환
        currentParameterView === 'env' ? (
          hasEnvParams ? (
            <ParametersList
              title=""
              paramEntries={envEntries}
              ariaLabel="Environment parameters"
            />
          ) : (
            <EmptyWrap>
              <EmptyTitle>{envEmptyMessage}</EmptyTitle>
            </EmptyWrap>
          )
        ) : (
          hasAlgParams ? (
            <ParametersList
              title=""
              paramEntries={algEntries}
              ariaLabel="Algorithm parameters"
            />
          ) : (
            <EmptyWrap>
              <EmptyTitle>{algEmptyMessage}</EmptyTitle>
            </EmptyWrap>
          )
        )
      )}
    </ParameterCard>
  );
};

export default ParameterNavigator;
