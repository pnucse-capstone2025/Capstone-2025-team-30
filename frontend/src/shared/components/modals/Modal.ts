import styled from 'styled-components';

// Form 관련 컴포넌트들을 import
import { FormHelpText, FormInput, FormLabel } from '../styles/Form';

/* ===== 공통 모달 스타일 ===== */

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: 600px;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: #111;
  }
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  color: #666;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background: #f5f5f5;
    color: #333;
  }
`;

export const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const ModalFooter = styled.div`
  padding: 16px 24px 24px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
  background: #fafafa;
`;

/* ===== 템플릿 리스트 스타일 ===== */

export const TemplateList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const TemplateItem = styled.li`
  background: white;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
`;

export const TemplateHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

export const TemplateName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111;
`;

export const TemplateDate = styled.span`
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 4px;
  white-space: nowrap;
  align-self: flex-start;
`;

export const TemplateDescription = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.4;
`;

export const TemplateActions = styled.div`
  display: flex;
  gap: 8px;
`;

// 정보 행을 위한 새로운 스타일 컴포넌트
export const InfoRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
`;

// 환경/알고리즘 정보를 표시하는 태그 스타일
export const InfoTag = styled.span`
  font-size: 14px;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
`;

export const InfoTagsContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: 12px;
  flex-wrap: wrap;
`;

export const TemplateNameContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
`;

// 이름 밑에 정보들을 가로로 배치하는 컨테이너
export const InfoContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex: 1;
  margin-top: 4px;
`;

export const InfoItem = styled.span`
  font-size: 14px;
  color: #666;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
`;

/* ===== 폼 스타일 ===== */

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Form 컴포넌트들을 Form.ts에서 re-export
export { FormHelpText, FormInput, FormLabel };

/* ===== 로딩 스타일 ===== */

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
  font-size: 14px;
`;
