import { useEffect, useRef, useState } from 'react';
import {
  SelectorContainer,
  OptionList,
  SectionTitle
} from '@/shared/components/forms/Selector';
import {
  FormField,
  FormLabel,
  FormInput,
  FormHelpText,
  OptionButton
} from '@/shared/components/styles';
import { algorithmsApi, modelsApi } from '@/shared/api';
import type { AvailableModel } from '@/shared/api/models';
import type { AlgSchema, AlgField, AlgParams, AlgName } from '@/shared/types';

/**
 * 알고리즘 선택 컴포넌트의 Props 인터페이스
 */
interface AlgorithmSelectorProps {
  /** 알고리즘 변경 시 호출되는 콜백 함수 */
  onAlgorithmChange: (algName: AlgName, algConfig: AlgParams) => void;
  /** 유효성 검사 상태 변경 시 호출되는 콜백 함수 */
  onValidationChange?: (isValid: boolean) => void;
  /** 선택된 환경 이름 */
  selectedEnvironment?: string | null;
}

/**
 * 알고리즘 스키마를 가져오는 헬퍼 함수
 * @param algo - 알고리즘 이름
 * @returns 알고리즘 스키마 Promise
 */
const getAlgorithmSchema = (algo: string) => algorithmsApi.getAlgorithmSchema(algo);

/**
 * 알고리즘 선택 및 설정 컴포넌트
 * 사용자가 ML 알고리즘을 선택하고 해당 알고리즘의 파라미터를 설정할 수 있습니다.
 * 
 * @param onAlgorithmChange - 알고리즘 변경 시 호출되는 함수
 * @param onValidationChange - 유효성 검사 상태 변경 시 호출되는 함수
 */
export default function AlgorithmSelector({ 
  onAlgorithmChange, 
  onValidationChange,
  selectedEnvironment = null
}: AlgorithmSelectorProps) {
  // 선택된 알고리즘 이름
  const [algName, setAlgName] = useState<AlgName>('');
  // 사용 가능한 알고리즘 목록
  const [algList, setAlgList] = useState<AlgName[]>([]);
  // 알고리즘별 스키마 정보 (캐시)
  const [schemaByAlg, setSchemaByAlg] = useState<Record<AlgName, AlgSchema>>({});
  // 알고리즘별 설정값
  const [algConfigByAlg, setAlgConfigByAlg] = useState<Record<AlgName, AlgParams>>({});
  // 사용 가능한 모델 목록 (TSC, HF-LLM용)
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  // API 요청 취소를 위한 AbortController 참조
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 개별 필드의 유효성을 검사하는 함수
   * @param value - 검사할 값
   * @param field - 필드 스키마 정보
   * @returns 유효성 검사 결과
   */
  const getValidationResult = (value: string, field: AlgField): 'valid' | 'required' | 'notNumber' | 'belowMin' | 'aboveMax' | 'invalidStep' => {
    // 필수 필드 검증
    if (field.required && (!value || value === '')) {
      return 'required';
    }
    
    // 빈 값이지만 필수가 아닌 경우 유효
    if (!value || value === '') {
      return 'valid';
    }
    
    // 문자열 타입 필드는 값이 있으면 유효
    if (field.type === 'string' || field.type === 'select') {
      return 'valid';
    }
    
    // 숫자 타입 필드 검증
    const REG_NUMBER = /^-?[0-9.]+$/;
    if (!REG_NUMBER.test(value)) return 'notNumber';

    const numValue = parseFloat(value);
    // 부동소수점 비교를 위한 작은 허용 오차
    const epsilon = 1e-10;
    
    if (field.min !== undefined && numValue < field.min - epsilon) return 'belowMin';
    if (field.max !== undefined && numValue > field.max + epsilon) return 'aboveMax';

    if (field.step !== undefined) {
      const stepValue = field.step;
      const remainder = (numValue - (field.min || 0)) % stepValue;
      if (Math.abs(remainder) > epsilon && Math.abs(remainder - stepValue) > epsilon) {
        return 'invalidStep';
      }
    }
    
    return 'valid';
  };

  /**
   * 전체 폼의 유효성을 검사하는 함수
   * @returns 폼이 유효한지 여부
   */
  const isFormValid = (): boolean => {
    if (!algName) return false;

    const currentSchema = schemaByAlg[algName];
    const currentAlgConfig = algConfigByAlg[algName] ?? {};

    if (!currentSchema) return false;
    
    return currentSchema.fields.every(field => {
      const value = currentAlgConfig[field.key] ?? '';
      return getValidationResult(value, field) === 'valid';
    });
  };

  // 알고리즘 목록 로드 (환경이 선택될 때마다)
  useEffect(() => {
    if (!selectedEnvironment) {
      setAlgList([]);
      return;
    }

    let mounted = true;
    
    algorithmsApi.getAlgorithms(selectedEnvironment)
      .then(response => {
        if (!mounted) return;
        
        const list = (response.data?.algorithms ?? []) as AlgName[];
        setAlgList(list);
        
        // 현재 선택된 알고리즘이 새로운 목록에 없으면 초기화
        if (algName && !list.includes(algName)) {
          setAlgName('');
        }
      })
      .catch(error => {
        console.error('알고리즘 목록 로드 실패:', error);
        setAlgList([]);
      });
    return () => { mounted = false; };
  }, [selectedEnvironment, algName]);

  // TSC 또는 HF-LLM 선택 시 사용 가능한 모델 목록 로드
  useEffect(() => {
    if ((algName === 'tsc' || algName === 'hf-llm') && selectedEnvironment) {
      modelsApi.getAvailableModels(selectedEnvironment)
        .then(response => {
          setAvailableModels(response.data?.models ?? []);
        })
        .catch(error => {
          console.error('모델 목록 로드 실패:', error);
          setAvailableModels([]);
        });
    } else {
      setAvailableModels([]);
    }
  }, [algName, selectedEnvironment]);

  // 선택한 알고리즘의 스키마를 필요 시 서버에서 로드 (간단 캐시)
  useEffect(() => {
    if (!algName) return;
    if (schemaByAlg[algName]) return;

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    getAlgorithmSchema(algName)
      .then((response) => {
        if (abortController.signal.aborted) return;
        
        const schema = response.data as AlgSchema;
        setSchemaByAlg(prev => ({ ...prev, [algName]: schema }));

        // 기존 값 보존 + 스키마 기반 초기값 채우기
        setAlgConfigByAlg(prev => {
          const prevAlgConfig = prev[algName] ?? {};
          const next: AlgParams = {};
          for (const field of schema.fields) {
            if (prevAlgConfig[field.key] !== undefined && prevAlgConfig[field.key] !== '') {
              next[field.key] = prevAlgConfig[field.key];
            } else if (field.default !== undefined) {
              next[field.key] = String(field.default);
            } else {
              next[field.key] = '';
            }
          }
          return { ...prev, [algName]: next };
        });
      })
      .catch(error => {
        console.error('알고리즘 스키마 로드 실패:', error);
      });

    return () => abortController.abort();
  }, [algName, schemaByAlg]);

  // 상위 콜백으로 선택/값 변화 전달
  useEffect(() => {
    if (!algName) return;
    onAlgorithmChange(algName, algConfigByAlg[algName] ?? {});
  }, [algName, algConfigByAlg]);

  // 유효성 상태 변화 시 상위 컴포넌트에 전달
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid());
    }
  }, [algName, algConfigByAlg, schemaByAlg, onValidationChange]);

  // 현재 선택된 알고리즘의 스키마와 설정값
  const currentSchema = schemaByAlg[algName];
  const currentAlgConfig = algConfigByAlg[algName] ?? {};
  const currentFields: AlgField[] = currentSchema?.fields ?? [];

  /**
   * 알고리즘 선택 핸들러
   * @param alg - 선택된 알고리즘 이름
   */
  const handleSelectAlg = (alg: AlgName) => setAlgName(alg);

  /**
   * 알고리즘 설정값 변경 핸들러
   * @param key - 설정 키
   * @param value - 설정 값
   */
  const handleAlgConfigChange = (key: string, value: string) => {
    setAlgConfigByAlg(prev => ({
      ...prev,
      [algName]: { ...(prev[algName] ?? {}), [key]: value }
    }));
  };

  /**
   * Teacher 모델 선택 핸들러
   * @param selectedModel - 선택된 모델 정보
   */
  const handleTeacherModelSelect = (selectedModel: AvailableModel) => {
    setAlgConfigByAlg(prev => ({
      ...prev,
      [algName]: { 
        ...(prev[algName] ?? {}), 
        teacher_name: selectedModel.runName,
        teacher_algo: selectedModel.algName
      }
    }));
  };

  return (
    <SelectorContainer>
      <FormField>
        <FormLabel>알고리즘</FormLabel>
        <OptionList>
          {algList.map((alg) => (
            <OptionButton
              key={alg}
              type="button"
              onClick={() => handleSelectAlg(alg)}
              $active={alg === algName}
              aria-pressed={alg === algName}
            >
              {alg}
            </OptionButton>
          ))}
        </OptionList>
      </FormField>

      {currentSchema && currentSchema.groups.map(group => {
        const groupFields = currentFields.filter(f => f.group === group.id);
        if (!groupFields.length) return null;

        return (
          <div key={group.id}>
            <SectionTitle>{group.label}</SectionTitle>
            {groupFields.map((field) => {
              const currentValue = currentAlgConfig[field.key] ?? '';
              const validationResult = getValidationResult(currentValue, field);
              const isValid = validationResult === 'valid';
              
              // Teacher Model 선택 필드 처리
              if (field.key === 'teacher_name' && (algName === 'tsc' || algName === 'hf-llm')) {
                return (
                  <FormField key={field.key}>
                    <FormLabel>{field.label}</FormLabel>
                    <select
                      value={currentValue}
                      onChange={(e) => {
                        const selectedModel = availableModels.find(model => model.runName === e.target.value);
                        if (selectedModel) {
                          handleTeacherModelSelect(selectedModel);
                        }
                      }}
                      style={{
                        width: '90%',
                        padding: '8px 12px',
                        border: `1px solid ${!isValid ? '#ef4444' : '#d1d5db'}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="">모델을 선택하세요</option>
                      {availableModels.map((model) => (
                        <option key={model.runName} value={model.runName}>
                          {model.runName} ({model.algName})
                        </option>
                      ))}
                    </select>
                    {!isValid && (
                      <FormHelpText>
                        {validationResult === 'required' && '필수 입력 항목입니다.'}
                      </FormHelpText>
                    )}
                  </FormField>
                );
              }
              
              // Teacher Algorithm 필드는 읽기 전용으로 표시
              if (field.key === 'teacher_algo' && (algName === 'tsc' || algName === 'hf-llm')) {
                return (
                  <FormField key={field.key}>
                    <FormLabel>{field.label}</FormLabel>
                    <FormInput
                      type="text"
                      value={currentValue}
                      readOnly
                      style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
                    />
                  </FormField>
                );
              }
              
              return (
                <FormField key={field.key}>
                  <FormLabel>{field.label}</FormLabel>
                  <FormInput
                    type="number"
                    value={currentValue}
                    onChange={(e) => handleAlgConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    {...(field.min !== undefined ? { min: field.min } : {})}
                    {...(field.max !== undefined ? { max: field.max } : {})}
                    {...(field.step !== undefined ? { step: field.step } : {})}
                    $invalid={!isValid && !!currentValue}
                  />
                  {!isValid && (
                    <FormHelpText>
                      {validationResult === 'required' && '필수 입력 항목입니다.'}
                      {validationResult === 'notNumber' && '숫자만 입력할 수 있습니다.'}
                      {validationResult === 'belowMin' && `값은 ${field.min} 이상이어야 합니다.`}
                      {validationResult === 'aboveMax' && `값은 ${field.max} 이하여야 합니다.`}
                      {validationResult === 'invalidStep' && `${field.step} 단위로 입력해주세요.`}
                    </FormHelpText>
                  )}
                </FormField>
              );
            })}
          </div>
        );
      })}
    </SelectorContainer>
  );
}