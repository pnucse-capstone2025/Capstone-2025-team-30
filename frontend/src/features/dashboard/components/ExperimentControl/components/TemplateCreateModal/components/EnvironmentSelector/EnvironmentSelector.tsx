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
import { environmentsApi } from '@/shared/api';

import type { EnvSchema, EnvField, EnvParams, EnvName } from '@/shared/types';

/**
 * 환경 선택 컴포넌트의 Props 인터페이스
 */
interface EnvironmentSelectorProps {
  /** 환경 변경 시 호출되는 콜백 함수 */
  onEnvironmentChange: (envName: EnvName, envConfig: EnvParams) => void;
  /** 유효성 검사 상태 변경 시 호출되는 콜백 함수 */
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * 환경 스키마를 가져오는 헬퍼 함수
 * @param env - 환경 이름
 * @returns 환경 스키마 Promise
 */
const getEnvironmentSchema = (env: string) => environmentsApi.getEnvironmentSchema(env);

/**
 * 환경 선택 및 설정 컴포넌트
 * 사용자가 ML 환경을 선택하고 해당 환경의 파라미터를 설정할 수 있습니다.
 * 
 * @param onEnvironmentChange - 환경 변경 시 호출되는 함수
 * @param onValidationChange - 유효성 검사 상태 변경 시 호출되는 함수
 */
export default function EnvironmentSelector({ 
  onEnvironmentChange, 
  onValidationChange 
}: EnvironmentSelectorProps) {
  // 사용 가능한 환경 목록
  const [environments, setEnvironments] = useState<EnvName[]>([]);
  // 선택된 환경 이름
  const [envName, setEnvName] = useState<EnvName>('');
  // 환경별 스키마 정보 (캐시)
  const [schemaByEnv, setSchemaByEnv] = useState<Record<EnvName, EnvSchema>>({});
  // 환경별 설정값
  const [envConfigByEnv, setEnvConfigByEnv] = useState<Record<EnvName, EnvParams>>({});
  // API 요청 취소를 위한 AbortController 참조
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 개별 필드의 유효성을 검사하는 함수
   * @param value - 검사할 값
   * @param field - 필드 스키마 정보
   * @returns 유효성 검사 결과
   */
  const getValidationResult = (value: string, field: EnvField): 'valid' | 'notNumber' | 'belowMin' | 'aboveMax' => {
    if (!value || value === '') return 'valid'; // 빈 값은 유효로 간주
    
    const REG_NUMBER = /^-?[0-9.]+$/;
    if (!REG_NUMBER.test(value)) return 'notNumber';

    const numValue = parseFloat(value);
    if (field.min !== undefined && numValue < field.min) return 'belowMin';
    if (field.max !== undefined && numValue > field.max) return 'aboveMax';
    
    return 'valid';
  };

  /**
   * 전체 폼의 유효성을 검사하는 함수
   * @returns 폼이 유효한지 여부
   */
  const isFormValid = (): boolean => {
    if (!envName) return false;

    const currentSchema = schemaByEnv[envName];
    const currentEnvConfig = envConfigByEnv[envName] ?? {};

    if (!currentSchema) return false;
    
    return currentSchema.fields.every(field => {
      const value = currentEnvConfig[field.key] ?? '';
      return getValidationResult(value, field) === 'valid';
    });
  };

  // 환경 목록 로드 (최초 1회)
  useEffect(() => {
    let mounted = true;
    
    environmentsApi.getEnvironments()
      .then(response => {
        if (!mounted) return;
        
        const list = (response.data?.environments ?? []) as EnvName[];
        setEnvironments(list);
      })
      .catch(error => {
        console.error('환경 목록 로드 실패:', error);
      });
    return () => { mounted = false; };
  }, []);

  // 선택한 환경의 스키마를 필요 시 서버에서 로드 (간단 캐시)
  useEffect(() => {
    if (!envName) return;
    if (schemaByEnv[envName]) return;

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    getEnvironmentSchema(envName)
      .then((response) => {
        if (abortController.signal.aborted) return;
        
        const schema = response.data as EnvSchema;
        setSchemaByEnv(prev => ({ ...prev, [envName]: schema }));

        // 기존 값 보존 + 스키마 기반 초기값 채우기
        setEnvConfigByEnv(prev => {
          const prevEnvConfig = prev[envName] ?? {};
          const next: EnvParams = {};
          for (const field of schema.fields) {
            if (prevEnvConfig[field.key] !== undefined && prevEnvConfig[field.key] !== '') {
              next[field.key] = prevEnvConfig[field.key];
            } else if (field.default !== undefined) {
              next[field.key] = String(field.default);
            } else {
              next[field.key] = '';
            }
          }
          return { ...prev, [envName]: next };
        });
      })
      .catch(error => {
        console.error('환경 스키마 로드 실패:', error);
      });

    return () => abortController.abort();
  }, [envName, schemaByEnv]);

  // 상위 콜백으로 선택/값 변화 전달
  useEffect(() => {
    if (!envName) return;
    onEnvironmentChange(envName, envConfigByEnv[envName] ?? {});
  }, [envName, envConfigByEnv, onEnvironmentChange]);

  // 유효성 상태 변화 시 상위 컴포넌트에 전달
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isFormValid());
    }
  }, [envName, envConfigByEnv, schemaByEnv, onValidationChange]);

  // 현재 선택된 환경의 스키마와 설정값
  const currentSchema = schemaByEnv[envName];
  const currentEnvConfig = envConfigByEnv[envName] ?? {};
  const currentFields: EnvField[] = currentSchema?.fields ?? [];

  /**
   * 환경 선택 핸들러
   * @param env - 선택된 환경 이름
   */
  const handleSelectEnv = (env: EnvName) => setEnvName(env);

  /**
   * 환경 설정값 변경 핸들러
   * @param key - 설정 키
   * @param value - 설정 값
   */
  const handleEnvConfigChange = (key: string, value: string) => {
    setEnvConfigByEnv(prev => ({
      ...prev,
      [envName]: { ...(prev[envName] ?? {}), [key]: value }
    }));
  };

  return (
    <SelectorContainer>
      <FormField>
        <FormLabel>환경</FormLabel>
        <OptionList>
          {environments.map((env) => (
            <OptionButton
              key={env}
              type="button"
              onClick={() => handleSelectEnv(env)}
              $active={env === envName}
              aria-pressed={env === envName}
            >
              {env}
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
              const currentValue = currentEnvConfig[field.key] ?? '';
              const validationResult = getValidationResult(currentValue, field);
              const isValid = validationResult === 'valid';
              
              return (
                <FormField key={field.key}>
                  <FormLabel>{field.label}</FormLabel>
                  <FormInput
                    type="number"
                    value={currentValue}
                    onChange={(e) => handleEnvConfigChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    {...(field.min !== undefined ? { min: field.min } : {})}
                    {...(field.max !== undefined ? { max: field.max } : {})}
                    $invalid={!isValid && !!currentValue}
                  />
                  {!isValid && currentValue && (
                    <FormHelpText>
                      {validationResult === 'notNumber' && '숫자만 입력할 수 있습니다.'}
                      {validationResult === 'belowMin' && `값은 ${field.min} 이상이어야 합니다.`}
                      {validationResult === 'aboveMax' && `값은 ${field.max} 이하여야 합니다.`}
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