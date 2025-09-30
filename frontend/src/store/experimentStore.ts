import { create } from 'zustand';


interface TrainingDataPoint {
  timesteps: number;
  reward?: number;
  loss?: number;
  exploration?: number;
  efficiency?: number;
  [key: string]: any;
}

/**
 * 테스트 모델 상세 정보 타입
 * run 데이터의 모든 정보를 포함합니다.
 */
interface TestModelDetailInfo {
  runId: string;
  runName: string;
  envName: string;
  envConfig: Record<string, string | number | boolean>;
  algName: string;
  algConfig: Record<string, string | number | boolean>;
  createdAt?: string;
  status?: string;
}

interface ExperimentState {
  /* ===== 템플릿 관련 ===== */
  templateId: string | null;
  setTemplateId: (id: string | null) => void;

  templateName: string;

  templateConfig: any;

  templateNote: string;
  setTemplateNote: (note: string) => void;

  setTemplateData: (data: {
    id: string;
    name: string;
    note: string;
    algName: string;
    envName: string;
    algConfig: any;
    envConfig: any;
    createdAt: string;
  }) => void;

  resetTemplate: () => void;

  /* ===== 실행 관련 ===== */
  runId: string | null;
  setRunId: (id: string | null) => void;

  runName: string | null;
  setRunName: (name: string | null) => void;

  trainingStatus: 'idle' | 'running' | 'paused' | 'failed' | 'completed' | 'stopped';
  setTrainingStatus: (status: 'idle' | 'running' | 'paused' | 'failed' | 'completed' | 'stopped') => void;

  /* ===== 모델 테스트 관련 ===== */
  testModelId: string | null;
  setTestModelId: (id: string | null) => void;

  testingStatus: 'invalid' | 'idle' | 'testing' | 'paused' | 'completed';
  setTestingStatus: (status: 'invalid' | 'idle' | 'testing' | 'paused' | 'completed') => void;

  // 통합된 테스트 모델 상세 정보
  testModelDetailInfo: TestModelDetailInfo | null;
  setTestModelDetailInfo: (info: TestModelDetailInfo) => void;
  resetTestModel: () => void;

  /* ===== 실시간 Training Metrics 관련 ===== */
  trainingMetrics: TrainingDataPoint[];
  setTrainingMetrics: (metrics: TrainingDataPoint[]) => void;

  // 스트리밍 헬퍼
  resetTrainingMetrics: () => void;
  appendTrainingMetric: (data: { timesteps: number; chartMetrics: any }) => void;

  /* ===== 실시간 메트릭 관련 ===== */
  // SSE 연결은 StreamingManager에서 직접 관리

  /* ===== 비디오 플레이어 관련 ===== */
  videoRun: boolean;
  setVideoRun: (videoRun: boolean) => void;
  trainingSpeedLevel: number;
  setTrainingSpeedLevel: (speedLevel: number) => void;

  /* ===== WebRTC 관련 ===== */
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;

  canConnect: boolean;
  setCanConnect: (canConnect: boolean) => void;

  /* ===== 결과 페이지 관련 ===== */
  resultRunId: string | null;
  setResultRunId: (id: string | null) => void;

  resultRunDetailInfo: any;
  setResultRunDetailInfo: (info: any) => void;

  resultMetricsData: any;
  setResultMetricsData: (data: any) => void;

  /* ===== 비교 실험 관련 ===== */
  selectedComparisons: Array<{
    runId: string;
    runName: string;
    algName: string;
    runDetailInfo: any;
    metricsData: any;
  }>;
  setSelectedComparisons: (comparisons: Array<{
    runId: string;
    runName: string;
    algName: string;
    runDetailInfo: any;
    metricsData: any;
  }>) => void;
  addSelectedComparison: (comparison: {
    runId: string;
    runName: string;
    algName: string;
    runDetailInfo: any;
    metricsData: any;
  }) => void;
  clearSelectedComparisons: () => void;
}

export const useExperimentStore = create<ExperimentState>((set) => ({
  /* ===== 템플릿 관련 ===== */
  templateId: null,
  setTemplateId: (id) => set({ templateId: id }),

  templateName: '',

  templateConfig:null,

  templateNote: '',
  setTemplateNote: (note) => set({ templateNote: note }),

  setTemplateData: (data) => set({
    templateName: data.name,
    templateNote: data.note,
    templateConfig: {
      algName: data.algName,
      envName: data.envName,
      algConfig: data.algConfig,
      envConfig: data.envConfig,
      createdAt: data.createdAt
    },
  }),

  resetTemplate: () => set({
    templateId: null,
    templateName: '',
    templateConfig: null,
    templateNote: '',
  }),

  /* ===== 실행 관련 ===== */
  runId: null,
  setRunId: (id) => set({ runId: id }),

  runName: null,
  setRunName: (name) => set({ runName: name }),

  trainingStatus: 'idle',
  setTrainingStatus: (status) => set({ trainingStatus: status }),

  /* ===== 모델 테스트 관련 ===== */
  testModelId: null,
  setTestModelId: (id) => set({ testModelId: id }),

  testingStatus: 'invalid',
  setTestingStatus: (status) => set({ testingStatus: status }),

  // 통합된 테스트 모델 상세 정보
  testModelDetailInfo: null,
  setTestModelDetailInfo: (info) => set({ testModelDetailInfo: info }),

  resetTestModel: () => set({
    testModelId: null,
    testModelDetailInfo: null,
    testingStatus: 'invalid',
  }),

  /* ===== 실시간 Training Metrics 관련 ===== */
  trainingMetrics: [],
  setTrainingMetrics: (metrics) => set({ trainingMetrics: metrics }),

  resetTrainingMetrics: () => set({ trainingMetrics: [] }),

  appendTrainingMetric: (data: { timesteps: number; chartMetrics: any }) => {
    const { timesteps, chartMetrics } = data;
    
    console.log('🔍 experimentStore - received data:', data);
    console.log('📊 experimentStore - chartMetrics:', chartMetrics);
    
    // chartMetrics를 그대로 사용 (백엔드에서 이미 표준화됨)
    // undefined 값들을 null로 변환
    const cleanedMetrics = Object.fromEntries(
      Object.entries(chartMetrics || {}).map(([key, value]) => [
        key, 
        value === undefined ? null : value
      ])
    );
    
    const metricsObj: any = { 
      timesteps,
      ...cleanedMetrics
    };
    
    console.log('✅ experimentStore - metricsObj:', metricsObj);

    set(state => ({
      trainingMetrics: [...state.trainingMetrics, metricsObj]
    }));
  },


  /* ===== 비디오 플레이어 관련 ===== */
  videoRun: false,
  setVideoRun: (videoRun) => set({ videoRun }),
  trainingSpeedLevel: 2,
  setTrainingSpeedLevel: (speedLevel) => set({ trainingSpeedLevel: speedLevel }),

  /* ===== WebRTC 관련 ===== */
  isConnecting: false,
  setIsConnecting: (connecting) => set({ isConnecting: connecting }),

  canConnect: false,
  setCanConnect: (canConnect) => set({ canConnect: canConnect }),

  /* ===== 결과 페이지 관련 ===== */
  resultRunId: null,
  setResultRunId: (id) => set({ resultRunId: id }),

  resultRunDetailInfo: null,
  setResultRunDetailInfo: (info) => set({ resultRunDetailInfo: info }),

  resultMetricsData: null,
  setResultMetricsData: (data) => set({ resultMetricsData: data }),

  /* ===== 비교 실험 관련 ===== */
  selectedComparisons: [],
  setSelectedComparisons: (comparisons) => set({ selectedComparisons: comparisons }),
  addSelectedComparison: (comparison) => set(state => ({
    selectedComparisons: [...state.selectedComparisons, comparison]
  })),
  clearSelectedComparisons: () => set({ selectedComparisons: [] }),
}));