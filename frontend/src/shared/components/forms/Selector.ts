import styled from 'styled-components';

/* ===== Selector Specific Styles ===== */

// 섹션 제목
export const SectionTitle = styled.h4`
  margin: 20px 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
  
  &:first-child {
    margin-top: 0;
  }
`;

// 셀렉터 컨테이너
export const SelectorContainer = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

// 옵션 리스트
export const OptionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 16px;
`;
