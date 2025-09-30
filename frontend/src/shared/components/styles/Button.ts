import styled from 'styled-components';

/* ===== 통일된 버튼 스타일 ===== */

// 기본 버튼 스타일 (베이스)
const BaseButton = styled.button<{ disabled?: boolean }>`
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  outline: none;
  
  &:focus {
    outline: none;
  }
`;

// Primary 버튼 (주요 액션)
export const PrimaryButton = styled(BaseButton)`
  background: ${({ disabled }) => (disabled ? '#d1d5db' : '#111')};
  color: ${({ disabled }) => (disabled ? '#9ca3af' : 'white')};
  border-color: ${({ disabled }) => (disabled ? '#d1d5db' : '#111')};

  &:hover:not(:disabled) {
    background: #374151;
    border-color: #374151;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    background: #1f2937;
    border-color: #1f2937;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Secondary 버튼 (보조 액션)
export const SecondaryButton = styled(BaseButton)`
  background: white;
  color: #374151;
  border-color: #d1d5db;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &:active:not(:disabled) {
    background: #f3f4f6;
    border-color: #6b7280;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Success 버튼 (성공/시작 액션)
export const SuccessButton = styled(BaseButton)`
  background: ${({ disabled }) => (disabled ? '#d1d5db' : '#059669')};
  color: white;
  border-color: ${({ disabled }) => (disabled ? '#d1d5db' : '#059669')};

  &:hover:not(:disabled) {
    background: #047857;
    border-color: #047857;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
  }

  &:active:not(:disabled) {
    background: #065f46;
    border-color: #065f46;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Danger 버튼 (위험/삭제 액션)
export const DangerButton = styled(BaseButton)`
  background: white;
  color: #dc2626;
  border-color: #dc2626;

  &:hover:not(:disabled) {
    background: #dc2626;
    color: white;
    border-color: #dc2626;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  }

  &:active:not(:disabled) {
    background: #b91c1c;
    border-color: #b91c1c;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Ghost 버튼 (투명 배경)
export const GhostButton = styled(BaseButton)`
  background: transparent;
  color: #6b7280;
  border-color: transparent;

  &:hover:not(:disabled) {
    background: #f3f4f6;
    color: #374151;
    border-color: #e5e7eb;
    transform: translateY(-1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  &:active:not(:disabled) {
    background: #e5e7eb;
    border-color: #d1d5db;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Small 버튼 (작은 크기)
export const SmallButton = styled(BaseButton)`
  padding: 6px 12px;
  font-size: 12px;
  min-width: 60px;
`;

// Large 버튼 (큰 크기)
export const LargeButton = styled(BaseButton)`
  padding: 12px 24px;
  font-size: 16px;
  min-width: 120px;
`;

// Option 버튼 (선택 옵션용)
export const OptionButton = styled(BaseButton)<{ $active?: boolean }>`
  padding: 6px 12px;
  font-size: 14px;
  min-width: auto;
  background: ${({ $active }) => ($active ? '#111' : 'white')};
  color: ${({ $active }) => ($active ? 'white' : '#374151')};
  border-color: ${({ $active }) => ($active ? '#111' : '#d1d5db')};

  &:hover:not(:disabled) {
    background: ${({ $active }) => ($active ? '#374151' : '#f9fafb')};
    color: ${({ $active }) => ($active ? 'white' : '#111')};
    border-color: ${({ $active }) => ($active ? '#374151' : '#111')};
    transform: translateY(-1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  &:active:not(:disabled) {
    background: ${({ $active }) => ($active ? '#1f2937' : '#f3f4f6')};
    border-color: ${({ $active }) => ($active ? '#1f2937' : '#6b7280')};
    transform: translateY(0);
    box-shadow: none;
  }
`;

/* ===== 호환성을 위한 기존 버튼명 별칭 ===== */

// 기존 코드와의 호환성을 위한 별칭
export const SaveButton = PrimaryButton;
export const ActionButton = SecondaryButton;
export const StartButton = SuccessButton;
export const EditButton = GhostButton;
export const CancelButton = SecondaryButton;
