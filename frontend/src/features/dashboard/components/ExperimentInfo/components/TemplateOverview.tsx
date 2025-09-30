import { useExperimentStore } from '@/store/experimentStore';
import { formatDate } from '@/shared/utils/dateUtils';
import {
  OverviewInfoTable,
  OverviewInfoRow,
  OverviewInfoLabel,
  OverviewInfoValue
} from '@/shared/components/styles/OverviewInfo';

/**
 * 템플릿 개요 컴포넌트
 * 선택된 실험 템플릿의 기본 정보를 표시하는 컴포넌트
 * 실험 이름, 환경, 알고리즘, 생성일 등의 정보를 테이블 형태로 보여줌
 * 
 * @returns JSX.Element
 */
export default function TemplateOverview() {
  // 전역 상태에서 템플릿 관련 정보 가져오기
  const templateConfig = useExperimentStore((state) => state.templateConfig);
  const templateName = useExperimentStore((state) => state.templateName) || '-';

  // 템플릿 정보 추출 - 기본값 '-'로 설정하여 undefined 방지
  const envName = templateConfig?.envName ?? '-';
  const algName = templateConfig?.algName ?? '-';
  const createdAt = templateConfig?.createdAt ?? '-';

  return (
    <OverviewInfoTable>
      <OverviewInfoRow $isLast={false}>
        <OverviewInfoLabel>실험 이름</OverviewInfoLabel>
        <OverviewInfoValue title={templateName}>{templateName}</OverviewInfoValue>
      </OverviewInfoRow>
      <OverviewInfoRow $isLast={false}>
        <OverviewInfoLabel>환경</OverviewInfoLabel>
        <OverviewInfoValue title={envName}>{envName.toUpperCase()}</OverviewInfoValue>
      </OverviewInfoRow>
      <OverviewInfoRow $isLast={false}>
        <OverviewInfoLabel>알고리즘</OverviewInfoLabel>
        <OverviewInfoValue title={algName}>{algName.toUpperCase()}</OverviewInfoValue>
      </OverviewInfoRow>
      <OverviewInfoRow $isLast={true}>
        <OverviewInfoLabel>생성일</OverviewInfoLabel>
        <OverviewInfoValue>{createdAt !== '-' ? formatDate(createdAt) : '-'}</OverviewInfoValue>
      </OverviewInfoRow>
    </OverviewInfoTable>
  );
}