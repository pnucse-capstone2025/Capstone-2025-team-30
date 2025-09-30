import styled from 'styled-components';

/**
 * 액션 버튼 컨테이너 스타일 컴포넌트
 * 다운로드, 삭제 등의 액션 버튼들을 배치하는 컨테이너
 * 버튼 너비를 동적으로 조정 가능
 */
export const ActionButtonContainer = styled.div<{ $buttonWidth?: string }>`
  display: flex;
  gap: 8px;
  justify-content: center;
  
  button {
    flex: 1;
    min-width: ${props => props.$buttonWidth || '100px'};
    max-width: ${props => props.$buttonWidth || '120px'};
  }
`;
