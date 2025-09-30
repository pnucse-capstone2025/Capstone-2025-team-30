import React from 'react';
import styled from 'styled-components';
import Toast from './Toast';
import type { Toast as ToastType } from './types';

/**
 * 토스트 컨테이너 스타일 컴포넌트
 * 화면 우상단에 토스트들을 배치하는 컨테이너
 */
const Container = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: none;
  
  > * {
    pointer-events: auto;
  }
`;

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

/**
 * 토스트 컨테이너 컴포넌트
 * 토스트 목록을 관리하고 화면에 표시하는 컨테이너
 * @param toasts - 표시할 토스트 배열
 * @param onRemove - 토스트 제거 콜백 함수
 */
const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <Container>
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </Container>
  );
};

export default ToastContainer;
