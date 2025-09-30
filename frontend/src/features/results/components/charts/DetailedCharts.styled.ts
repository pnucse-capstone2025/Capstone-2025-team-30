import styled from 'styled-components';
import { HoverCard as Card } from "@/shared/components/ui/Card";

/**
 * 카드 콘텐츠 스타일 컴포넌트
 * 차트 카드 내부의 콘텐츠 영역을 정의
 */
export const CardContent = styled.div`
  padding: 16px;
`;

/**
 * 상세 차트 섹션 스타일 컴포넌트
 * 상세 차트들을 담는 섹션 컨테이너
 */
export const DetailedChartsSection = styled.div`
  margin-top: 24px;
`;

/**
 * 상세 차트 카드 스타일 컴포넌트
 * 상세 차트를 표시하는 카드의 최소 높이를 정의
 */
export const DetailedChartCard = styled(Card)`
  min-height: 300px;
`;
