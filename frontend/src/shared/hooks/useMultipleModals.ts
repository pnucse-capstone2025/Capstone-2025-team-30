import { useState, useCallback } from 'react';

/**
 * 여러 모달의 상태를 동시에 관리하는 커스텀 훅
 * @param modalKeys 모달 키 배열
 * @returns 각 모달의 상태와 제어 함수들
 */
export const useMultipleModals = (modalKeys: string[]) => {
  const [modals, setModals] = useState<Record<string, boolean>>(
    modalKeys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const openModal = useCallback((key: string) => {
    setModals(prev => ({ ...prev, [key]: true }));
  }, []);

  const closeModal = useCallback((key: string) => {
    setModals(prev => ({ ...prev, [key]: false }));
  }, []);

  const toggleModal = useCallback((key: string) => {
    setModals(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => 
      Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {})
    );
  }, []);

  return {
    modals,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals,
    isModalOpen: (key: string) => modals[key] || false
  };
};
