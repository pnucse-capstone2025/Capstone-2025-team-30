import styled from 'styled-components';

/**
 * 차트 컨테이너 스타일 컴포넌트
 * 다크 테마의 차트 배경과 패딩을 제공
 */
export const ChartContainer = styled.div`
  background: #1f1f23;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
`;

/**
 * 차트 제목 스타일 컴포넌트
 * 차트의 제목을 표시하는 헤딩 요소
 */
export const ChartTitle = styled.h3`
  color: #e0e0e0;
  margin-bottom: 16px;
  font-weight: 600;
`;

/**
 * 차트 라벨 스타일 컴포넌트
 * 차트의 라벨 텍스트를 표시하는 요소
 */
export const ChartLabel = styled.span`
  color: #e0e0e0;
  font-size: 14px;
`;