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
import styled from 'styled-components';

/**
 * 스크롤 가능한 파라미터 리스트 컨테이너 스타일 컴포넌트
 * 최대 높이 제한과 커스텀 스크롤바 스타일을 제공
 */
const ScrollableParameterList = styled.div`
  max-height: 30vh; /* 약 5개 항목 높이 */
  overflow-y: auto;
  
  /* 스크롤바 스타일링 */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`;

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

interface ParametersListProps {
  title: string;
  paramEntries: [string, unknown][];
  ariaLabel: string;
}

/**
 * 파라미터 리스트 컴포넌트
 * 키-값 쌍의 파라미터들을 테이블 형태로 표시
 * @param title - 파라미터 그룹 제목
 * @param paramEntries - 파라미터 키-값 쌍 배열
 * @param ariaLabel - 접근성을 위한 aria-label
 */
export default function ParametersList({ title = '', paramEntries, ariaLabel }: ParametersListProps) {

  return (
    <Group>
      <GroupTitle>{title}</GroupTitle>
      {paramEntries.length > 0 ? (
        <ScrollableParameterList>
          <KVTable role="table" aria-label={ariaLabel}>
            {paramEntries.map(([key, value], i) => (
              <KVRow key={key} role="row" $isLast={i === paramEntries.length - 1}>
                <KeyCell role="cell" title={toTitleCase(key)}>{toTitleCase(key)}</KeyCell>
                <ValueCell role="cell" title={String(value ?? '—')}>
                  {String(value ?? '—')}
                </ValueCell>
              </KVRow>
            ))}
          </KVTable>
        </ScrollableParameterList>
      ) : (
        <EmptyText>{title}가 없습니다.</EmptyText>
      )}
    </Group>
  );
}
