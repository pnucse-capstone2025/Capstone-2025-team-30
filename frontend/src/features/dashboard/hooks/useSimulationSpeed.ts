import { useExperimentStore } from '@/store/experimentStore';
import { runsApi } from '@/shared/api';
import { UILogger } from '@/shared/utils/logger';

/**
 * 시뮬레이터 속도 설정 매핑
 * 속도 레벨에 따른 라벨과 값을 정의
 */
const SPEED_SETTINGS = {
  1: { label: '느림', value: 0.5 },
  2: { label: '보통', value: 1.0 },
  3: { label: '빠름', value: 2.0 },
  4: { label: '매우빠름', value: 5.0 }
} as const;

/**
 * 시뮬레이션 속도 제어를 위한 커스텀 훅
 */
export const useSimulationSpeed = () => {
  const setSpeedLevel = useExperimentStore(state => state.setTrainingSpeedLevel);

  /**
   * 시뮬레이션 속도 변경 핸들러
   * 사용자가 선택한 속도로 시뮬레이션 속도를 변경
   * @param level - 속도 레벨 (1-4)
   */
  const handleSpeedChange = async (currentRunId: null | string, level: number) => {
    setSpeedLevel(level);
    
    if (currentRunId) {
      const speedValue = SPEED_SETTINGS[level as keyof typeof SPEED_SETTINGS].value;
      
      try {
        await runsApi.changeSimSpeed(currentRunId, { speed: speedValue });
        UILogger.action('시뮬레이션 속도 변경', { 
          speed: speedValue, 
          level: SPEED_SETTINGS[level as keyof typeof SPEED_SETTINGS].label 
        });
      } catch (error) {
        UILogger.error('useSimulationSpeed', `시뮬레이션 속도 변경 실패: ${error}`);
      }
    }
  };

  return {
    handleSpeedChange,
    SPEED_SETTINGS
  };
};