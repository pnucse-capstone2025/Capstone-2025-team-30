import styled from 'styled-components';
import { Link } from 'react-router-dom';

/**
 * 헤더 컨테이너 스타일 컴포넌트
 * 다크 테마의 상단 헤더 레이아웃을 제공
 */
export const HeaderContainer = styled.header`
  background-color: #1f1f23;
  padding: 0.75rem max(1rem, calc((100vw - 1400px) / 2)); /* 대시보드와 동일한 반응형 패딩 */
  color: white;
  border-bottom: 1px solid #333;
`;

/**
 * 네비게이션 스타일 컴포넌트
 * 헤더 내 메뉴 아이템들을 배치하는 컨테이너
 */
export const Navigation = styled.nav`
  display: flex;
  align-items: center;
  margin-left: 1.5rem;
`;

/**
 * 네비게이션 링크 스타일 컴포넌트
 * 활성 상태에 따라 스타일이 변경되는 메뉴 링크
 */
export const NavLink = styled(Link)<{ $isActive?: boolean }>`
  color: ${({ $isActive }) => ($isActive ? '#fff' : '#a8b3c1')};
  text-decoration: none;
  font-weight: ${({ $isActive }) => ($isActive ? '500' : '400')};
  padding: 0.4rem 0.8rem; /* 패딩 줄임 */
  border-radius: 6px;
  transition: all 0.2s ease-in-out;
  position: relative;

  &:hover {
    color: #fff;
    text-decoration: none;
  }
`;

/**
 * 메뉴 구분자 스타일 컴포넌트
 * 메뉴 아이템 간 구분을 위한 세퍼레이터
 */
export const Separator = styled.span`
  color: #4a5568;
  font-size: 0.85rem; /* 구분자 크기도 살짝 줄임 */
  user-select: none;
  opacity: 0.6;
  margin: 0 0.5rem; /* 구분자 양옆 마진 추가 */
`;