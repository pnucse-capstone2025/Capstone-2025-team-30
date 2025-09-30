import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import type { Toast as ToastType } from './types';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

/**
 * 토스트 애니메이션 - 슬라이드 인
 */
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

/**
 * 토스트 애니메이션 - 슬라이드 아웃
 */
const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;


/**
 * 토스트 컨테이너 스타일 컴포넌트
 * 토스트의 기본 스타일과 애니메이션을 제공
 */
const ToastContainer = styled.div<{ type: string; $isExiting?: boolean }>`
  position: relative;
  min-width: 320px;
  max-width: 480px;
  padding: 16px 20px;
  margin-bottom: 12px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: ${({ $isExiting }) => $isExiting ? slideOut : slideIn} 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  ${({ type }) => {
    switch (type) {
      case 'success':
        return `
          background-color: #10b981;
          color: white;
        `;
      case 'error':
        return `
          background-color: #ef4444;
          color: white;
        `;
      case 'warning':
        return `
          background-color: #f59e0b;
          color: white;
        `;
      case 'info':
        return `
          background-color: #3b82f6;
          color: white;
        `;
      default:
        return `
          background-color: #6b7280;
          color: white;
        `;
    }
  }}
`;

/**
 * 토스트 닫기 버튼 스타일 컴포넌트
 * 토스트를 수동으로 닫을 수 있는 버튼
 */
const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  opacity: 0.8;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  
  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

/**
 * 토스트 컴포넌트
 * 알림 메시지를 표시하고 자동으로 사라지는 토스트 UI
 * @param toast - 토스트 정보 객체
 * @param onRemove - 토스트 제거 콜백 함수
 */
const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration]);

  /**
   * 토스트 제거 핸들러
   * 애니메이션과 함께 토스트를 제거
   */
  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 400); // 애니메이션 시간과 동일
  };

  return (
    <ToastContainer type={toast.type} $isExiting={isExiting} onClick={handleRemove}>
      {toast.message}
      <CloseButton onClick={(e) => {
        e.stopPropagation();
        handleRemove();
      }}>
        ×
      </CloseButton>
    </ToastContainer>
  );
};

export default Toast;
