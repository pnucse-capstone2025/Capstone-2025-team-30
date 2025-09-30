import { useState, useEffect } from 'react';
import { getServerConfig } from '@/core/config';

/**
 * 서버 설정을 가져오는 커스텀 훅
 * @returns 서버 설정 정보와 로딩 상태
 */
export const useServerConfig = () => {
  const [useWebSocket, setUseWebSocket] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    const fetchConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const res = await getServerConfig();
        
        if (!cancelled) {
          setUseWebSocket(res.useWebSocket);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch server config:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch server config');
          setLoading(false);
        }
      }
    };

    fetchConfig();
    
    return () => { cancelled = true; };
  }, []);

  return { useWebSocket, loading, error };
};
