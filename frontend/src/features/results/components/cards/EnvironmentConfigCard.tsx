import React from 'react';
import { HoverCard as Card } from "@/shared/components/ui/Card";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { ParametersList } from "@/shared/components/ui/ParameterList";
import { Chip } from "./ConfigCard.styled";

/**
 * 환경 설정 카드 컴포넌트의 Props 인터페이스
 */
interface EnvironmentConfigCardProps {
  /** 환경 설정 객체 */
  envConfig: Record<string, any> | null;
}

/**
 * 환경 설정 카드 컴포넌트
 * 선택된 실험의 환경 설정 값들을 표시합니다.
 * 설정이 없는 경우 "미설정" 상태를 표시합니다.
 * 
 * @param envConfig - 환경 설정 객체
 */
const EnvironmentConfigCard: React.FC<EnvironmentConfigCardProps> = ({ envConfig }) => {
  const hasConfig = envConfig && Object.keys(envConfig).length > 0;
  
  return (
    <Card>
      <div>
        <CardTitle>환경 설정 값</CardTitle>
        {hasConfig ? (
          <ParametersList
            title=""
            paramEntries={Object.entries(envConfig)}
            ariaLabel="환경 설정 값 목록"
          />
        ) : (
          <Chip>미설정</Chip>
        )}
      </div>
    </Card>
  );
};

export default EnvironmentConfigCard;
