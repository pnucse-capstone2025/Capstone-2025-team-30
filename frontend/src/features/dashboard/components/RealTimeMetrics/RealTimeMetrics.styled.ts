import styled from 'styled-components';

/**
 * 메트릭 컨테이너 스타일
 * 실시간 메트릭 차트들을 담는 최상위 컨테이너
 */
export const MetricsContainer = styled.div`
  height: 100%;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
`;

/**
 * 메트릭 그리드 스타일
 * 2x2 그리드 레이아웃으로 차트들을 배치
 */
export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  height: 100%;
  width: 100%;
`;

/**
 * 차트 컨테이너 스타일
 * 개별 차트를 담는 카드 형태의 컨테이너
 * 호버 시 시각적 피드백 제공
 */
export const ChartContainer = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  border: 1px solid #e0e0e0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-2px) scale(1.01);
  }
`;

/**
 * 차트 제목 스타일
 * 각 차트의 제목을 표시하는 헤더
 */
export const ChartTitle = styled.h3`
  color: #333;
  margin: 0 0 8px 0;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
`;

/**
 * 차트 래퍼 스타일
 * 실제 차트 컴포넌트를 담는 컨테이너
 * 유연한 크기 조정과 오버플로우 처리
 */
export const ChartWrapper = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;