import {
  EmptyText
} from '@/shared/components/ui/EmptyState';
import {
  Group,
  GroupTitle,
  KVTable,
  KVRow,
  KeyCell,
  ValueCell
} from '@/shared/components/styles';

/**
 * camelCase와 snake_case를 Title Case로 변환하는 헬퍼 함수
 * @param str - 변환할 문자열
 * @returns Title Case로 변환된 문자열
 */
const toTitleCase = (str: string): string => {
  let words = str.replace(/_/g, ' ');
  words = words.replace(/([A-Z])/g, ' $1');
  
  return words
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * 파라미터 목록 컴포넌트의 Props 인터페이스
 */
interface ParametersListProps {
  /** 그룹 제목 */
  title: string;
  /** 파라미터 엔트리 배열 [키, 값] 형태 */
  paramEntries: [string, unknown][];
  /** 접근성을 위한 aria-label */
  ariaLabel: string;
}

/**
 * 파라미터 목록을 표시하는 컴포넌트
 * 키-값 쌍의 파라미터들을 테이블 형태로 렌더링
 * 
 * @param title - 그룹 제목
 * @param paramEntries - 파라미터 엔트리 배열
 * @param ariaLabel - 접근성을 위한 aria-label
 */
export default function ParametersList({ title, paramEntries, ariaLabel }: ParametersListProps) {

  return (
    <Group>
      <GroupTitle>{title}</GroupTitle>
      {paramEntries.length > 0 ? (
        <KVTable role="table" aria-label={ariaLabel}>
          {paramEntries.map(([key, value], index) => (
            <KVRow key={key} role="row" $isLast={index === paramEntries.length - 1}>
              <KeyCell role="cell" title={toTitleCase(key)}>{toTitleCase(key)}</KeyCell>
              <ValueCell role="cell" title={String(value ?? '—')}>
                {String(value ?? '—')}
              </ValueCell>
            </KVRow>
          ))}
        </KVTable>
      ) : (
        <EmptyText>{title}가 없습니다.</EmptyText>
      )}
    </Group>
  );
}