import React from "react";
import { PrimaryButton } from "@/shared/components/styles/Button";
import { DetailedChartsHeaderContainer, DetailedChartsTitle } from "./DetailedChartsHeader.styled";

/**
 * 상세 차트 헤더 컴포넌트의 Props 인터페이스
 */
interface DetailedChartsHeaderProps {
  /** 확장/축소 상태 */
  isExpanded: boolean;
  /** 토글 핸들러 함수 */
  onToggle: () => void;
}

/**
 * 상세 차트 헤더 컴포넌트
 * 상세 차트 섹션의 헤더를 표시하고 확장/축소 버튼을 제공
 * 
 * @param isExpanded - 확장/축소 상태
 * @param onToggle - 토글 핸들러 함수
 */
const DetailedChartsHeader: React.FC<DetailedChartsHeaderProps> = ({
  isExpanded,
  onToggle
}) => {
  return (
    <DetailedChartsHeaderContainer>
      <DetailedChartsTitle>상세 지표</DetailedChartsTitle>
      <PrimaryButton onClick={onToggle} style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}>
        {isExpanded ? '접기' : '펼치기'}
      </PrimaryButton>
    </DetailedChartsHeaderContainer>
  );
};

export default DetailedChartsHeader;
