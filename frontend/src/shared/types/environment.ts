// ===== 환경 관련 타입 =====

export type EnvGroup = {
  id: string;
  label: string;
};

export type EnvField = {
  key: string;
  label: string;
  type: 'number';
  group: string;
  placeholder?: string;
  min?: number;
  max?: number;
  default?: string;
};

export type EnvSchema = {
  groups: EnvGroup[];
  fields: EnvField[];
};

export type EnvParams = Record<string, string>;
export type EnvName = string;
