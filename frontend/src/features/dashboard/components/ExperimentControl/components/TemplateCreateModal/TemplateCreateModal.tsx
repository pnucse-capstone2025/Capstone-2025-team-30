import { useState, useCallback } from 'react';
import EnvironmentSelector from '@/features/dashboard/components/ExperimentControl/components/TemplateCreateModal/components/EnvironmentSelector/EnvironmentSelector';
import AlgorithmSelector from '@/features/dashboard/components/ExperimentControl/components/TemplateCreateModal/components/AlgorithmSelector/AlgorithmSelector';
import { useExperimentStore } from '@/store/experimentStore';
import { useToastNotification } from '@/shared/hooks';
import { templatesApi } from '@/shared/api';
import { UILogger } from '@/shared/utils/logger';
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalBody,
  ModalFooter,
  FormSection,
  FormLabel,
  FormInput,
  FormHelpText
} from '@/shared/components/modals';
import { PrimaryButton } from '@/shared/components/styles';

/**
 * 환경 설정 타입
 */
type EnvConfig = { [key: string]: string };

/**
 * 알고리즘 설정 타입
 */
type AlgConfig = { [key: string]: string };

/**
 * 템플릿 설정 타입
 */
type TemplateConfigType = {
  envName: string | null;
  envConfig: EnvConfig;
  algName: string | null;
  algConfig: AlgConfig;
};

/**
 * 템플릿 생성 모달 컴포넌트
 * 사용자가 실험 템플릿을 생성할 수 있는 모달
 * 
 * @param onClose - 모달 닫기 함수
 */
export default function TemplateCreateModal({ onClose }: { onClose: () => void }) {
  // 템플릿 이름
  const [templateName, setTemplateName] = useState<string>('');
  // 템플릿 ID 설정 함수
  const setTemplateId = useExperimentStore((state) => state.setTemplateId);
  // 토스트 알림 함수들
  const { showSuccess, showError, showWarning } = useToastNotification();

  // 템플릿 설정 상태
  const [templateConfig, setTemplateConfig] = useState<TemplateConfigType>({
    envName: null, 
    envConfig: {},
    algName: null,
    algConfig: {},
  });

  // 유효성 검사 상태
  const [isAlgorithmValid, setIsAlgorithmValid] = useState(false);
  const [isEnvironmentValid, setIsEnvironmentValid] = useState(false);

  /**
   * 템플릿 이름 유효성 검사 함수
   * @param name - 검사할 템플릿 이름
   * @returns 유효한 이름인지 여부
   */
  const isTemplateNameValid = (name: string): boolean => {
    if (!name || name.trim() === '') return true; // 빈 값은 유효로 간주 (required는 별도 처리)
    
    // 영어, 숫자, 언더스코어, 하이픈, 점만 허용
    const validPattern = /^[a-zA-Z0-9_.-]+$/;
    return validPattern.test(name.trim());
  };

  /**
   * 환경 변경 핸들러
   * @param envName - 선택된 환경 이름
   * @param envConfig - 환경 설정값
   */
  const environmentChange = useCallback((envName: string, envConfig: EnvConfig) => {
    setTemplateConfig((prev) => ({
      ...prev,
      envName,
      envConfig
    }));
  }, []);

  /**
   * 알고리즘 변경 핸들러
   * @param algName - 선택된 알고리즘 이름
   * @param algConfig - 알고리즘 설정값
   */
  const algorithmChange = useCallback((algName: string, algConfig: AlgConfig) => {
    setTemplateConfig(prev => ({
      ...prev,
      algName,
      algConfig,
    }));
  }, []);

  /**
   * 템플릿 생성 핸들러
   */
  const handleCreate = async () => {
    const trimmedName = templateName.trim();

    // 유효성 검사 - null 값 체크
    if (!templateConfig.envName || !templateConfig.algName) {
      showError('환경과 알고리즘을 모두 선택해주세요.');
      return;
    }

    try {
      const templateData = {
        name: trimmedName,
        envName: templateConfig.envName,
        envConfig: templateConfig.envConfig,
        algName: templateConfig.algName,
        algConfig: templateConfig.algConfig
      };

      const response = await templatesApi.createTemplate(templateData);
      
      if (response.data?.templateId) {
        setTemplateId(response.data.templateId);
        UILogger.action('템플릿 생성 성공', { templateId: response.data.templateId });

        showSuccess('실험이 생성되었습니다.');
        onClose();
      } else {
        showError('실험 생성에 실패했습니다. 다시 시도해주세요.');
      }

    } catch (error) {
      UILogger.error('TemplateCreateModal', `실험 생성 에러: ${error}`);
      
      if (error instanceof Error && (error.message?.includes('409') || error.message?.includes('이미 사용 중'))) {
        showWarning('이미 사용 중인 이름입니다. 다른 이름을 입력해주세요.');
      } else {
        showError('실험 생성 중 오류가 발생했습니다.');
      }
    }
  };

  // 폼 유효성 검사 - 복잡한 조건을 변수로 분리
  const trimmedName = templateName.trim();
  const isNameValid = isTemplateNameValid(trimmedName);
  const hasEnvironment = !!templateConfig.envName;
  const hasAlgorithm = !!templateConfig.algName;
  const canSave = !!trimmedName && isNameValid && hasEnvironment && hasAlgorithm;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={event => event.stopPropagation()}>
        <ModalHeader>
          <h2>실험 생성</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <FormSection>
            <FormLabel>실험 이름</FormLabel>
            <FormInput
              type="text"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="영어, 숫자, _, -, . 만 사용 가능"
              $invalid={!!trimmedName && !isNameValid}
            />
            {trimmedName && !isNameValid && (
              <FormHelpText>
                실험 이름은 영어, 숫자, 언더스코어(_), 하이픈(-), 점(.)만 사용할 수 있습니다.
              </FormHelpText>
            )}
          </FormSection>

          <FormSection>
            <EnvironmentSelector 
              onEnvironmentChange={environmentChange} 
              onValidationChange={setIsEnvironmentValid}
            />
          </FormSection>

          <FormSection>
            <AlgorithmSelector 
              onAlgorithmChange={algorithmChange}
              onValidationChange={setIsAlgorithmValid}
              selectedEnvironment={templateConfig.envName}
            />
          </FormSection>
        </ModalBody>

        <ModalFooter>
          <PrimaryButton 
            onClick={handleCreate} 
            disabled={!canSave || !isAlgorithmValid || !isEnvironmentValid}
          >
            실험 생성
          </PrimaryButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}