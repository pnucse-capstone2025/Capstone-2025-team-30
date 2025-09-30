import styled from 'styled-components';

/**
 * 기본 카드 컨테이너 스타일 컴포넌트
 * 표준 카드 레이아웃을 제공하는 기본 컨테이너
 */
export const CardContainer = styled.div`
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

/**
 * 호버 효과가 있는 카드 컨테이너 스타일 컴포넌트
 * 마우스 호버 시 그림자와 변형 효과를 제공
 */
export const HoverCardContainer = styled.div`
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;

  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-2px) scale(1.01);
  }
`;
/**
 * 카드 제목 스타일 컴포넌트
 * 카드의 제목을 표시하는 헤딩 요소
 */
export const CardTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 700;
  flex-shrink: 0;
`;

/**
 * 카드 내용 영역 스타일 컴포넌트
 * 카드의 메인 콘텐츠를 표시하는 스크롤 가능한 영역
 */
export const CardContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
`;

/**
 * 플랫 스타일 카드 컨테이너 스타일 컴포넌트
 * 테두리와 그림자 없이 깔끔한 플랫 디자인을 제공
 */
export const FlatCardContainer = styled.div`
  padding: 16px;
  background-color: #fff;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;
