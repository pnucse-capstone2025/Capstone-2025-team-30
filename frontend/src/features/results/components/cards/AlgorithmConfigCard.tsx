import React from 'react';
import { HoverCard as Card } from "@/shared/components/ui/Card";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { ParametersList } from "@/shared/components/ui/ParameterList";
import { Chip } from "./ConfigCard.styled";

/**
 * 알고리즘 설정 카드 컴포넌트의 Props 인터페이스
 */
interface AlgorithmConfigCardProps {
  /** 알고리즘 설정 객체 */
  algConfig: Record<string, any> | null;
}

/**
 * 알고리즘 설정 카드 컴포넌트
 * 선택된 실험의 알고리즘 설정 값들을 표시합니다.
 * 설정이 없는 경우 "미설정" 상태를 표시합니다.
 * 
 * @param algConfig - 알고리즘 설정 객체
 */
const AlgorithmConfigCard: React.FC<AlgorithmConfigCardProps> = ({ algConfig }) => {
  const hasConfig = algConfig && Object.keys(algConfig).length > 0;
  
  return (
    <Card>
      <div>
        <CardTitle>알고리즘 설정 값</CardTitle>
        {hasConfig ? (
          <ParametersList
            title=""
            paramEntries={Object.entries(algConfig)}
            ariaLabel="알고리즘 설정 값 목록"
          />
        ) : (
          <Chip>미설정</Chip>
        )}
      </div>
    </Card>
  );
};

export default AlgorithmConfigCard;
