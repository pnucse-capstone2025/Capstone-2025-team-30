import React from "react";
import styled from "styled-components";

/**
 * 상세 차트 그리드 컨테이너 스타일 컴포넌트
 * 상세 차트들을 2열 그리드로 배치하는 컨테이너
 * 확장/축소 상태에 따라 표시 여부가 결정
 */
const DetailedChartsGridContainer = styled.div<{ $isExpanded: boolean }>`
  display: ${props => props.$isExpanded ? 'grid' : 'none'};
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
`;

/**
 * 상세 차트 그리드 컴포넌트의 Props 인터페이스
 */
interface DetailedChartsGridProps {
  /** 그리드 확장/축소 상태 */
  isExpanded: boolean;
  /** 그리드 내부에 표시할 자식 요소들 */
  children: React.ReactNode;
}

/**
 * 상세 차트 그리드 컴포넌트
 * 상세 차트들을 2열 그리드 레이아웃으로 배치
 * 확장/축소 상태에 따라 표시 여부를 제어
 * 
 * @param isExpanded - 그리드 확장/축소 상태
 * @param children - 그리드 내부에 표시할 자식 요소들
 */
const DetailedChartsGrid: React.FC<DetailedChartsGridProps> = ({
  isExpanded,
  children
}) => {
  return (
    <DetailedChartsGridContainer $isExpanded={isExpanded}>
      {children}
    </DetailedChartsGridContainer>
  );
};

export default DetailedChartsGrid;
