import styled from 'styled-components';

/* ===== 현대적이고 세련된 정보 패널 스타일 ===== */

export const PanelRoot = styled.div`
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 내부 스크롤 방지 */
  padding: 4px;
  & > * { min-width: 0; }
`;

export const StickyHeader = styled.div`
  background: #fff;
  padding-top: 12px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

export const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 4px;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
    
    &:hover {
      background: #94a3b8;
    }
  }
`;

export const SummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Pill = styled.span<{ $tone: 'env' | 'alg' }>`
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  background: #1f1f23;
  color: #f9fafb;
  border: 1px solid #262a30;
`;

export const Heading = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111;
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: -0.025em;
`;

export const DividerDot = styled.span`
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #d1d5db;
  display: inline-block;
  opacity: 0.6;
`;

/* 그룹(섹션) */
export const Group = styled.section`
  & + & { 
    margin-top: 24px; 
  }
`;

export const GroupTitle = styled.h4`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.025em;
`;

export const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
`;

export const GroupActions = styled.div`
  display: flex;
  gap: 8px;
`;

/* 현대적인 테이블형 리스트 */
export const KVTable = styled.div`
  display: block;
  background: #fff;
  overflow: hidden;
`;

export const KVRow = styled.div<{ $isLast?: boolean }>`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  padding: 12px 16px;
  align-items: flex-start;
  transition: background-color 0.2s ease;

  /* 행 구분선 */
  border-bottom: ${({ $isLast }) => ($isLast ? 'none' : '1px solid #f3f4f6')};
  
  /* 호버 효과 */
  &:hover {
    background-color: #f5f5f5;
  }

  min-width: 0;
`;

export const KeyCell = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  text-align: left;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

export const ValueCell = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #111;
  text-align: right;
  word-break: break-word;
  overflow-wrap: anywhere;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  padding: 4px 8px;
`;
