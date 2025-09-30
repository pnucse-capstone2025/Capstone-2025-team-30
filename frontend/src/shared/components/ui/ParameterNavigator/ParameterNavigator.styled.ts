import styled from 'styled-components';

/**
 * 파라미터 카드 컨테이너 스타일 컴포넌트
 * 파라미터 네비게이터의 메인 컨테이너
 */
export const ParameterCard = styled.div`
  position: relative;
`;

/**
 * 네비게이션 헤더 스타일 컴포넌트
 * 파라미터 전환 버튼과 제목, 인디케이터를 포함하는 헤더
 */
export const NavigationHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

/**
 * 네비게이션 버튼 스타일 컴포넌트
 * 파라미터 뷰 전환을 위한 이전/다음 버튼
 */
export const NavigationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
  }

  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
    color: #374151;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * 파라미터 제목 스타일 컴포넌트
 * 현재 표시 중인 파라미터 그룹의 제목
 */
export const ParameterTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
`;

/**
 * 파라미터 인디케이터 컨테이너 스타일 컴포넌트
 * 현재 활성 파라미터를 표시하는 도트들의 컨테이너
 */
export const ParameterIndicator = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

/**
 * 인디케이터 도트 스타일 컴포넌트
 * 파라미터 뷰의 활성 상태를 나타내는 도트
 */
export const IndicatorDot = styled.div<{ $active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.$active ? '#3b82f6' : '#e5e7eb'};
  transition: background 0.2s ease;
`;

/**
 * 슬라이드 애니메이션을 위한 컨테이너 스타일 컴포넌트
 * 슬라이드 애니메이션의 오버플로우를 제어하는 컨테이너
 */
export const SlideContainer = styled.div`
  position: relative;
  overflow: hidden;
  width: 100%;
`;

/**
 * 슬라이드 가능한 컨텐츠 래퍼 스타일 컴포넌트
 * 슬라이드 애니메이션을 담당하는 래퍼 요소
 */
export const SlideWrapper = styled.div<{ 
  $currentView: 'env' | 'alg';
}>`
  display: flex;
  width: 200%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  transform: translateX(${props => {
    if (props.$currentView === 'env') return '0%';
    return '-50%';
  }});
`;

/**
 * 개별 슬라이드 컨텐츠 스타일 컴포넌트
 * 각 파라미터 그룹의 슬라이드 내용을 담는 컨테이너
 */
export const SlideContent = styled.div`
  width: 50%;
  flex-shrink: 0;
`;
