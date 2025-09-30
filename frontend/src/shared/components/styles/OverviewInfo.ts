import styled from 'styled-components';
import { KVTable, KVRow, KeyCell, ValueCell } from '@/shared/components/styles/Info';

/**
 * 개요 정보 테이블을 위한 공통 스타일 컴포넌트
 * 대시보드와 모델 테스트에서 공통으로 사용되는 정보 표시 스타일
 */

/**
 * 개요 정보 테이블 컨테이너
 * 기본 KVTable 스타일을 확장하여 개요 정보에 특화된 스타일을 적용
 */
export const OverviewInfoTable = styled.div`
  ${KVTable}
  border-radius: 8px;
  padding: 0 0 16px 0;
  font-size: 1.05rem;
`;

/**
 * 개요 정보 행
 * 기본 KVRow 스타일을 확장하여 개요 정보에 특화된 패딩을 적용
 */
export const OverviewInfoRow = styled(KVRow)`
  padding: 8px 0px;
  justify-content: space-between;
`;

/**
 * 개요 정보 라벨
 * 개요 정보의 키(라벨) 부분을 위한 스타일
 */
export const OverviewInfoLabel = styled(KeyCell)`
  width: 100px;
  font-size: 14px;
  color: #8b95a1;
  flex-shrink: 0;
`;

/**
 * 개요 정보 값
 * 개요 정보의 값 부분을 위한 스타일
 */
export const OverviewInfoValue = styled(ValueCell)`
  font-size: 16px;
  font-weight: 500;
  color: #222;
  word-break: break-all;
  flex: 1;
  text-align: right;
  font-family: inherit;
  padding: 0;
`;

/**
 * 정보 그리드 컨테이너
 * 대시보드와 모델 테스트에서 공통으로 사용되는 정보 카드들의 그리드 레이아웃
 */
export const InfoGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
`;
