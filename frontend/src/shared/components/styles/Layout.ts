import styled from "styled-components";

/* ===== 공통 레이아웃 스타일 (Dashboard & ModelTest) ===== */

export const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  padding: 0 max(1rem, calc((100vw - 1400px) / 2)); /* 반응형 패딩 */
`;

export const BodyGrid = styled.main`
  display: grid;
  grid-template-columns: 1.2fr 3fr;  /* 왼쪽(실험정보 유동) | 오른쪽(유동) */
  grid-template-rows: auto 1fr;      /* header | right(tab + content) */
  grid-template-areas:
    "left header"
    "left right";
  gap: 16px;
  padding: 16px;
  box-sizing: border-box;
  flex: 1;
  min-height: 0;
`;

export const RightColumn = styled.div`
  grid-area: right;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
`;

export const TabBar = styled.div`
  display: flex;
  align-items: center;
`;

export const TabButton = styled.button<{ $active?: boolean }>`
  background: #fff;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  color: ${({ $active }) => ($active ? '#111' : '#666')};
  transition: all 0.2s ease-in-out;
  outline: none; /* 클릭 시 outline 제거 */
  padding: 8px 16px; /* 패딩 추가로 클릭 영역 확대 */

  &:hover {
    color: #222;
    border-color: #aaa;
    background: #f9fafb;
  }

  &:focus {
    outline: none; /* 포커스 시에도 outline 제거 */
  }
`;

export const ContentArea = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: auto;
`;

export const LeftPanel = styled.div`
  grid-area: left;
  min-width: 0;
  overflow: auto;
`;

export const HeaderArea = styled.header`
  grid-area: header;
`;
