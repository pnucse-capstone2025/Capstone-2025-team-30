import { useLocation } from 'react-router-dom';
import {
  HeaderContainer,
  Navigation,
  NavLink,
  Separator
} from './Header.styled';

/**
 * 헤더 컴포넌트
 * 네비게이션 메뉴를 포함하는 상단 헤더를 제공
 * 현재 경로에 따라 활성 메뉴를 표시
 */
export default function Header() {
  const location = useLocation();

  return (
    <HeaderContainer>
      <Navigation>
        <NavLink to="/" $isActive={location.pathname === '/'}>
          대시보드
        </NavLink>
        <Separator>|</Separator>
        <NavLink to="/results" $isActive={location.pathname === '/results'}>
          결과
        </NavLink>
        <Separator>|</Separator>
        <NavLink to="/model-test" $isActive={location.pathname === '/model-test'}>
          모델 테스트
        </NavLink>
      </Navigation>
    </HeaderContainer>
  );
}