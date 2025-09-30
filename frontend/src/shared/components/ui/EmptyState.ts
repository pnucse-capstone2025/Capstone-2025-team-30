import styled from 'styled-components';

/**
 * 빈 상태 텍스트 스타일 컴포넌트
 * 작은 크기의 회색 텍스트를 표시하는 컴포넌트
 */
export const EmptyText = styled.div`
  font-size: 13px;
  color: #888;
`;

/**
 * 빈 상태 래퍼 스타일 컴포넌트
 * 빈 상태 콘텐츠를 중앙 정렬하여 배치하는 컨테이너
 */
export const EmptyWrap = styled.div`
  text-align: center;
  padding: 24px 8px;
`;

/**
 * 빈 상태 제목 스타일 컴포넌트
 * 빈 상태의 메인 제목을 표시하는 컴포넌트
 */
export const EmptyTitle = styled.div`
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 4px;
`;

/**
 * 빈 상태 부제목 스타일 컴포넌트
 * 빈 상태의 부제목이나 설명 텍스트를 표시하는 컴포넌트
 */
export const EmptySub = styled.div`
  color: #666;
  font-size: 16px;
`;
