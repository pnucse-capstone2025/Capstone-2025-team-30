import styled from 'styled-components';

/**
 * 환경 목록 컨테이너 스타일 컴포넌트
 * 환경 선택 버튼들을 배치하는 컨테이너
 */
export const EnvironmentList = styled.div`
  margin-bottom: 20px;
`;

/**
 * 환경 선택 버튼 스타일 컴포넌트
 * 환경을 선택할 수 있는 버튼의 스타일을 제공
 */
export const EnvironmentButton = styled.button`
  width: 100%;
  margin-bottom: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
  transition: background-color 0.2s;

  &:focus {
    outline: none;
  }
`;
