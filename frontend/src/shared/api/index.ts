// API 클라이언트와 타입들을 한 곳에서 export
export { ApiClient } from './client';
export * from './types';

// 각 API 모듈들을 export
export { templatesApi } from './templates';
export { runsApi } from './runs';
export { modelsApi } from './models';
export { algorithmsApi } from './algorithms';
export { environmentsApi } from './environments';
export { trainingMetricsApi } from './trainingMetrics';
export { artifactsApi } from './artifacts';

// 편의를 위한 통합 API 객체
import { templatesApi } from './templates';
import { runsApi } from './runs';
import { modelsApi } from './models';
import { algorithmsApi } from './algorithms';
import { environmentsApi } from './environments';
import { trainingMetricsApi } from './trainingMetrics';
import { artifactsApi } from './artifacts';

export const api = {
  templates: templatesApi,
  runs: runsApi,
  models: modelsApi,
  algorithms: algorithmsApi,
  environments: environmentsApi,
  trainingMetrics: trainingMetricsApi,
  artifacts: artifactsApi,
};
