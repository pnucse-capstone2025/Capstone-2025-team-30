/**
 * Results 페이지에서 사용하는 타입 정의
 */

// 실험 정보 (Results에서 사용하는 간소화된 Run 타입)
export interface RunInfo {
  runId?: string;
  runName?: string;
  status?: string;
  envName?: string;
  algName?: string;
  createdAt?: string;
  startTime?: string;
  envConfig?: Record<string, any>;
  algConfig?: Record<string, any>;
}

// 실험 선택 모달에서 사용하는 Run 타입 (API Run과 구분)
export interface RunForResults {
  runId: string;
  runName: string;
  algorithm: string;
  environment: string;
  status: string;
  createdAt: string;
}

// 훈련 메트릭 관련 타입들은 shared/api/trainingMetrics.ts에서 import
export type { 
  TrainingMetric, 
  ChartDataPoint, 
  TrainingMetricsResponse as TrainingMetricsData 
} from '../api/trainingMetrics';

// 컴포넌트 Props 타입들
export interface ResultHeaderProps {
  runDetailInfo: RunInfo | null;
  setRunDetailInfo: (runDetailInfo: RunInfo | null) => void;
  metricsData?: import('../api/trainingMetrics').TrainingMetricsResponse;
  onSelectCompareRuns?: (runs: RunForResults[]) => void;
  compareRuns?: RunForResults[];
}

export interface ResultBodyProps {
  runDetailInfo: RunInfo | null;
  runId?: string;
  onMetricsLoaded?: (data: import('../api/trainingMetrics').TrainingMetricsResponse) => void;
  compareRuns?: RunForResults[];
}
