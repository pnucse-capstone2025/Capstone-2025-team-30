import { useEffect, useRef } from 'react';

/**
 * 이전 값을 추적하는 커스텀 훅
 * @param value 추적할 값
 * @returns 이전 값
 */
export const usePreviousValue = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};
