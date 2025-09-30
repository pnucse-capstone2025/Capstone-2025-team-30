import styled from 'styled-components';

/* ===== Form Components ===== */

// 폼 필드 컨테이너
export const FormField = styled.div`
  margin-bottom: 12px;
`;

// 폼 라벨
export const FormLabel = styled.label`
  display: block;
  margin-bottom: 4px;
  color: #333;
  font-weight: 600;
`;

// 폼 입력 필드
export const FormInput = styled.input<{ $invalid?: boolean }>`
  width: 90%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #111;
    box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.1);
  }

  &:hover:not(:focus) {
    border-color: #9ca3af;
  }
  
  /* 숫자 입력 타입에 대한 특별한 스타일링 */
  &[type="number"] {
    text-align: right;
    
    /* 숫자 증감 버튼 숨기기: Chrome, Safari, Edge */
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    
    /* Firefox */
    -moz-appearance: textfield;
    
    /* 모바일에서 숫자 키보드 표시 */
    inputmode: decimal;
  }
  
  /* $invalid prop으로 조건부 스타일링 */
  ${({ $invalid }) => $invalid && `
    border-color: #dc2626;
    background-color: #fef2f2;
    
    &:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
    }
  `}

  /* 숫자가 아닌 문자 입력 방지를 위한 추가 스타일 */
  &[type="number"]:invalid {
    border-color: #dc2626;
    background-color: #fef2f2;

    &:focus {
      box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
    }
  }
`;

// 셀렉트 드롭다운
export const FormSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  color: #374151;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #111;
    box-shadow: 0 0 0 2px rgba(17, 17, 17, 0.1);
  }

  &:hover:not(:focus) {
    border-color: #9ca3af;
  }
`;

// 도움말 텍스트
export const FormHelpText = styled.p<{ color?: string }>`
  font-size: 12px;
  color: ${({ color }) => color || '#dc2626'};
  margin: 4px 0 0 0;
  line-height: 1.4;
`;

// 성공 메시지 텍스트
export const FormSuccessText = styled.p`
  font-size: 12px;
  color: #059669;
  margin: 4px 0 0 0;
  line-height: 1.4;
`;

// 상태 표시 텍스트 (읽기 전용)
export const FormStatusText = styled.div`
  font-size: 14px;
  color: #6b7280;
  margin-top: 8px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: #f9fafb;
`;

/* ===== 호환성을 위한 기존 컴포넌트명 별칭 ===== */

// 기존 코드와의 호환성을 위한 별칭
export const Field = FormField;
export const Label = FormLabel;
export const Input = FormInput;
export const Select = FormSelect;
export const HelpText = FormHelpText;
export const StatusText = FormStatusText;
