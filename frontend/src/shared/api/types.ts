// ===== 공통 타입 =====
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  error: string;
  details?: any;
}

// ===== 템플릿 관련 타입 =====
export interface Template {
  id: string;
  name: string;
  envName: string;
  algName: string;
  createdAt: string;
}

export interface TemplateDetail {
  id: string;
  name: string;
  envName: string;
  envConfig: Record<string, any>;
  algName: string;
  algConfig: Record<string, any>;
  note?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateRequest {
  name: string;
  envName: string;
  envConfig: Record<string, any>;
  algName: string;
  algConfig: Record<string, any>;
}

export interface UpdateTemplateRequest {
  name?: string;
  envName?: string;
  envConfig?: Record<string, any>;
  algName?: string;
  algConfig?: Record<string, any>;
}

// ===== 실험(Run) 관련 타입 =====
export interface Run {
  runId: string;
  runName: string;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'FAILED' | 'COMPLETED' | 'STOPPED';
  testStatus: 'INVALID' | 'IDLE' | 'TESTING' | 'PAUSED' | 'COMPLETED';
  templateId?: string;
  envName: string;
  algName: string;
  envConfig: Record<string, any>;
  algConfig: Record<string, any>;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface CreateRunRequest {
  totalSteps?: number;
}

export interface RunStatus {
  status: string;
  testStatus: string;
}

// ===== 모델 관련 타입 =====
export interface ModelTestRequest {
  episodesnum?: number;
}

export interface ModelTestResponse {
  testStatus: string;
  modelId: string;
  episodesnum: number;
}

// ===== 시뮬레이터 관련 타입 =====
export interface SimSpeedRequest {
  speed: number;
}

// ===== 노트 관련 타입 =====
export interface TemplateNote {
  id: string;
  templateId: string;
  note: string;
  updatedAt: string;
}

export interface UpdateNoteRequest {
  note: string;
}
