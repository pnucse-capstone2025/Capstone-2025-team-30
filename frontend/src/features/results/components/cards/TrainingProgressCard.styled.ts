import styled from 'styled-components';

/**
 * 진행률 정보 컨테이너 스타일 컴포넌트
 * 현재 스텝과 전체 스텝 정보를 표시하는 컨테이너
 */
export const ProgressInfo = styled.div`
  margin: 4px 0 8px 0;
  font-size: 12px;
  color: #64748b;
  text-align: center;
`;

/**
 * 원형 진행률 바 컨테이너 스타일 컴포넌트
 * SVG 원형 차트를 감싸는 컨테이너
 */
export const ProgressContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

/**
 * 원형 차트 래퍼 스타일 컴포넌트
 * SVG 원형 차트의 위치와 크기를 정의
 */
export const ChartWrapper = styled.div<{ $radius: number }>`
  position: relative;
  width: ${props => props.$radius * 2}px;
  height: ${props => props.$radius * 2}px;
`;

/**
 * 진행률 텍스트 스타일 컴포넌트
 * 원형 차트 중앙에 표시되는 퍼센트 텍스트
 */
export const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px;
  font-weight: 800;
`;

/**
 * 에러 메시지 스타일 컴포넌트
 * 메트릭 데이터가 없을 때 표시되는 메시지
 */
export const ErrorMessage = styled.p`
  margin: 0;
  text-align: center;
  color: #6b7280;
`;
