import styled from 'styled-components';

/**
 * 카드 콘텐츠 스타일 컴포넌트
 * 차트 카드 내부의 콘텐츠 영역을 정의
 */
export const CardContent = styled.div`
  padding: 16px;
`;

/**
 * 메트릭 그리드 스타일 컴포넌트
 * 주요 메트릭들을 2x2 그리드로 배치하는 컨테이너
 */
export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  width: 100%;
`;
