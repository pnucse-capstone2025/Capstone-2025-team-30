import React from 'react';
import { HoverCard as Card } from "@/shared/components/ui/Card";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { ParameterNavigator } from "@/shared/components/ui/ParameterNavigator";
import {
  EmptyWrap,
  EmptyTitle
} from '@/shared/components/ui/EmptyState';

/**
 * 통합 설정 카드 컴포넌트의 Props 인터페이스
 */
interface IntegratedConfigCardProps {
  /** 환경 설정 객체 */
  envConfig: Record<string, any> | null;
  /** 알고리즘 설정 객체 */
  algConfig: Record<string, any> | null;
  /** 카드 제목 (기본값: "설정") */
  title?: string;
}

/**
 * 통합 설정 카드 컴포넌트
 * 환경 설정과 알고리즘 설정을 하나의 카드에서 탭 형태로 표시합니다.
 * 설정이 없는 경우 빈 상태를 표시합니다.
 * 
 * @param envConfig - 환경 설정 객체
 * @param algConfig - 알고리즘 설정 객체
 * @param title - 카드 제목
 */
const IntegratedConfigCard: React.FC<IntegratedConfigCardProps> = ({ 
  envConfig, 
  algConfig, 
  title = "설정" 
}) => {
  const envEntries = envConfig ? Object.entries(envConfig) : [];
  const algEntries = algConfig ? Object.entries(algConfig) : [];
  const hasEnvParams = envEntries.length > 0;
  const hasAlgParams = algEntries.length > 0;

  // 둘 다 비어있으면 빈 상태 표시
  if (!hasEnvParams && !hasAlgParams) {
    return (
      <Card>
        <div>
          <CardTitle>{title}</CardTitle>
          <EmptyWrap>
            <EmptyTitle>설정된 설정 값이 없습니다.</EmptyTitle>
          </EmptyWrap>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div>
        <CardTitle>{title}</CardTitle>
        <ParameterNavigator
          envConfig={envConfig}
          algConfig={algConfig}
          showSlideAnimation={true}
          envTitle="환경 설정 값"
          algTitle="알고리즘 설정 값"
        />
      </div>
    </Card>
  );
};

export default IntegratedConfigCard;
