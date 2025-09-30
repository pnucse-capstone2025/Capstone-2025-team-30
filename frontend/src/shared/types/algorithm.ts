// ===== 알고리즘 관련 타입 =====

export type AlgGroup = {
  id: string;
  label: string;
};

export type AlgField = {
  key: string;
  label: string;   
  type: 'number' | 'string' | 'select' | 'int' | 'float';
  group: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  default?: number | string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  help?: string;
};

export type AlgSchema = {
  groups: AlgGroup[];
  fields: AlgField[];
};

export type AlgParams = Record<string, string>;
export type AlgName = string;
