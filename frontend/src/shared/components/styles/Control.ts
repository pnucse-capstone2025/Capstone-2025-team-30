import styled from "styled-components";

/* ===== 공통 컨트롤 스타일 (ExperimentControl & TestModelControl) ===== */

export const HeaderSection = styled.div`
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;

  
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  overflow: hidden; /* 내부 스크롤 방지 */

  &:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    transform: translateY(-2px);
  }
`;

export const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ProjectName = styled.h2<{ $hasTemplate?: boolean }>`
  color: ${props => props.$hasTemplate ? '#333' : '#999'};
  font-size: 1.2rem;
  margin: 0;
`;

export const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;
