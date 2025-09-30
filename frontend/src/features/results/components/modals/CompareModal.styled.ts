import styled from 'styled-components';

/**
 * 런 목록 컨테이너 스타일 컴포넌트
 * 비교할 런들을 나열하는 컨테이너
 */
export const RunList = styled.div`
  margin-bottom: 20px;
`;

/**
 * 런 아이템 스타일 컴포넌트
 * 개별 런을 표시하는 아이템의 스타일을 제공
 * 선택 상태와 비활성화 상태를 지원
 */
export const RunItem = styled.div<{ $isSelected: boolean; $isDisabled?: boolean }>`
  padding: 12px;
  border: 2px solid ${props => props.$isSelected ? '#007bff' : '#ddd'};
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: ${props => props.$isDisabled ? 'not-allowed' : 'pointer'};
  background-color: ${props => props.$isSelected ? '#f0f8ff' : 'white'};
  opacity: ${props => props.$isDisabled ? 0.5 : 1};
  
  &:hover {
    background-color: ${props => 
      props.$isDisabled 
        ? (props.$isSelected ? '#f0f8ff' : 'white')
        : (props.$isSelected ? '#e6f3ff' : '#f5f5f5')
    };
  }
`;

/**
 * 선택된 항목 수 표시 스타일 컴포넌트
 * 현재 선택된 항목의 개수를 표시
 */
export const SelectedCount = styled.div`
  padding: 8px 12px;
  background-color: #e9ecef;
  border-radius: 4px;
  font-size: 14px;
  color: #495057;
`;

/**
 * 런 제목 스타일 컴포넌트
 * 런의 이름을 표시하는 제목 스타일
 */
export const RunTitle = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
`;

/**
 * 런 정보 스타일 컴포넌트
 * 런의 상세 정보를 표시하는 스타일
 */
export const RunInfo = styled.div`
  font-size: 0.9em;
  color: #666;
`;
