import { useState, useCallback } from 'react';

/**
 * 모달 상태를 관리하는 커스텀 훅
 * @param initialOpen 초기 열림 상태 (기본값: false)
 * @returns 모달 상태와 제어 함수들
 */
export const useModalState = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, openModal, closeModal, toggleModal };
};
