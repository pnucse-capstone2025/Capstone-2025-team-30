import styled from 'styled-components';

/**
 * 상세 차트 헤더 컨테이너 스타일 컴포넌트
 * 상세 차트 섹션의 헤더를 담는 컨테이너
 * 호버 효과와 그림자 효과를 포함
 */
export const DetailedChartsHeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;

  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-2px) scale(1.01);
  }
`;

/**
 * 상세 차트 제목 스타일 컴포넌트
 * 상세 차트 섹션의 제목 텍스트 스타일을 정의
 */
export const DetailedChartsTitle = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
`;
