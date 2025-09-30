import { useState } from 'react';
import { ModalOverlay, ModalContent, ModalHeader, CloseButton, ModalBody, ModalFooter, FormInput, FormLabel, FormHelpText } from '@/shared/components/modals';
import { StartButton, CancelButton } from '@/shared/components/styles';
import styled from 'styled-components';

// 들여쓰기된 텍스트를 위한 스타일 컴포넌트
const IndentedText = styled.span`
  text-indent: 1em;
  display: inline-block;
`;

// 스텝 입력 컨테이너 스타일 - ModalBody가 패딩을 제공하므로 제거
const StepInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

/**
 * 스텝 설정 모달의 타입 정의
 */
export type StepSetModalType = 'training' | 'testing';

/**
 * 스텝 설정 모달 컴포넌트의 Props 인터페이스
 */
interface StepSetModalProps {
  /** 모달 닫기 콜백 함수 */
  onClose: () => void;
  /** 스텝 수 확인 콜백 함수 */
  onConfirm: (totalSteps: number) => void;
  /** 모달 타입 (학습용 또는 테스트용) */
  type: StepSetModalType;
}

/**
 * 학습 스텝 수 또는 테스트 횟수를 입력받는 모달 컴포넌트
 * 사용자가 ML 모델 학습에 사용할 총 스텝 수 또는 테스트 횟수를 설정할 수 있습니다.
 * 
 * @param onClose - 모달 닫기 함수
 * @param onConfirm - 스텝 수/횟수 확인 시 호출되는 함수
 * @param type - 모달 타입 ('training' | 'testing')
 */
export default function StepSetModal({ onClose, onConfirm, type }: StepSetModalProps) {
  // 타입별 설정값
  const config = {
    training: {
      title: '학습 스텝 설정',
      label: '총 학습 스텝 수',
      placeholder: '예: 100000',
      defaultValue: '100000',
      min: 1000,
      max: 5000000,
      step: 1000,
      helpText: '학습을 진행할 총 스텝 수를 입력하세요. (1,000 ~ 5,000,000) (1,000 단위)',
      warningText: (
        <>
          ※ PPO 알고리즘의 경우 2,048 스텝별로 끊기기 때문에,<br />
          <IndentedText>
            선택한 스텝보다 초과해서 학습할 수 있습니다.
          </IndentedText>
        </>
      ),
      validation: {
        min: 1000,
        max: 5000000,
        step: 1000,
        errorMessages: {
          empty: '총 스텝 수를 입력해주세요.',
          invalid: '1 이상의 숫자를 입력해주세요.',
          min: '최소 1,000 스텝부터 설정 가능합니다.',
          max: '최대 5,000,000 스텝까지 설정 가능합니다.',
          step: '1,000 단위로 입력해주세요.'
        }
      }
    },
    testing: {
      title: '테스트 횟수 설정',
      label: '총 테스트 횟수',
      placeholder: '예: 100',
      defaultValue: '100',
      min: 10,
      max: 1000,
      step: 1,
      helpText: '모델을 테스트할 총 횟수를 입력하세요. (10 ~ 1,000회)',
      warningText: null,
      validation: {
        min: 10,
        max: 1000,
        step: 1,
        errorMessages: {
          empty: '총 테스트 횟수를 입력해주세요.',
          invalid: '1 이상의 숫자를 입력해주세요.',
          min: '최소 10회부터 설정 가능합니다.',
          max: '최대 1,000회까지 설정 가능합니다.',
          step: ''
        }
      }
    }
  };

  const currentConfig = config[type];
  
  // 입력된 총 스텝 수/횟수 (문자열로 관리하여 입력 중 상태 처리)
  const [totalSteps, setTotalSteps] = useState<string>(currentConfig.defaultValue);
  // 유효성 검사 에러 메시지
  const [error, setError] = useState<string>('');

  /**
   * 입력값 변경 시 유효성 검사를 수행하는 핸들러
   * @param e - 입력 이벤트 객체
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setTotalSteps(inputValue);
    
    // 입력값 유효성 검사
    const stepValue = parseInt(inputValue);
    const { validation } = currentConfig;
    
    if (inputValue === '') {
      setError(validation.errorMessages.empty);
    } else if (isNaN(stepValue) || stepValue <= 0) {
      setError(validation.errorMessages.invalid);
    } else if (stepValue < validation.min) {
      setError(validation.errorMessages.min);
    } else if (stepValue > validation.max) {
      setError(validation.errorMessages.max);
    } else if (validation.step > 1 && stepValue % validation.step !== 0) {
      setError(validation.errorMessages.step);
    } else {
      setError('');
    }
  };

  /**
   * 폼 제출 시 최종 유효성 검사 후 스텝 수/횟수를 확인하는 핸들러
   * @param e - 폼 제출 이벤트 객체
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const stepValue = parseInt(totalSteps);
    
    // 에러가 없고 유효한 숫자인 경우에만 확인 처리
    if (!error && !isNaN(stepValue) && stepValue > 0) {
      onConfirm(stepValue);
    }
  };

  // 폼 유효성 상태 계산 - 복잡한 조건을 변수로 분리
  const currentStepValue = parseInt(totalSteps);
  const { validation } = currentConfig;
  const isStepValueValid = !isNaN(currentStepValue) && currentStepValue >= validation.min && currentStepValue <= validation.max;
  const isStepValueInStep = validation.step <= 1 || currentStepValue % validation.step === 0;
  const isFormValid = !error && totalSteps && isStepValueValid && isStepValueInStep;

  return (
    <ModalOverlay onClick={onClose}>
      {/* 모달 외부 클릭 시 닫기 방지를 위한 이벤트 전파 중단 */}
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h2>{currentConfig.title}</h2>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <StepInputContainer>
              <FormLabel htmlFor="totalSteps">
                {currentConfig.label}
              </FormLabel>
              <FormInput
                id="totalSteps"
                type="number"
                value={totalSteps}
                onChange={handleInputChange}
                placeholder={currentConfig.placeholder}
                min={currentConfig.min}
                max={currentConfig.max}
                step={currentConfig.step}
                autoFocus
              />
              {/* 에러 메시지 표시 */}
              {error && (
                <FormHelpText>
                  {error}
                </FormHelpText>
              )}
              {/* 도움말 텍스트 */}
              <FormHelpText color="#6b7280">
                {currentConfig.helpText}
              </FormHelpText>
              {/* 경고 텍스트 (학습용에만 표시) */}
              {currentConfig.warningText && (
                <FormHelpText color="#f59e0b">
                  {currentConfig.warningText}
                </FormHelpText>
              )}
            </StepInputContainer>
          </form>
        </ModalBody>

        <ModalFooter>
          <CancelButton type="button" onClick={onClose}>
            취소
          </CancelButton>
          {/* 폼이 유효하지 않으면 비활성화 */}
          <StartButton 
            type="submit" 
            disabled={!isFormValid}
            onClick={handleSubmit}
          >
            시작
          </StartButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
