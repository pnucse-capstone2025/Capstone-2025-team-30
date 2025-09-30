import styled from 'styled-components';

/**
 * 비교 테이블 스타일 컴포넌트
 * 실험 비교를 위한 테이블의 기본 스타일을 정의
 */
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

/**
 * 테이블 헤더 스타일 컴포넌트
 * 테이블 헤더의 배경색과 스타일을 정의
 */
export const TableHeader = styled.thead`
  background-color: #f8fafc;
`;

/**
 * 테이블 헤더 셀 스타일 컴포넌트
 * 테이블 헤더 셀의 패딩, 정렬, 폰트 스타일을 정의
 */
export const TableHeaderCell = styled.th`
  padding: 12px 16px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
`;

/**
 * 테이블 바디 스타일 컴포넌트
 * 테이블 바디의 기본 스타일을 정의
 */
export const TableBody = styled.tbody``;

/**
 * 테이블 행 스타일 컴포넌트
 * 테이블 행의 호버 효과와 테두리를 정의
 */
export const TableRow = styled.tr`
  border-bottom: 1px solid #f3f4f6;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

/**
 * 테이블 셀 스타일 컴포넌트
 * 일반 테이블 셀의 패딩, 정렬, 폰트 스타일을 정의
 */
export const TableCell = styled.td`
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  vertical-align: middle;
  text-align: center;
`;

/**
 * 실험명 스타일 컴포넌트
 * 실험명을 강조하여 표시하는 스타일을 정의
 */
export const ExperimentName = styled.div`
  font-weight: 600;
  color: #111;
  font-size: 15px;
`;

/**
 * 정보 텍스트 스타일 컴포넌트
 * 환경/알고리즘 정보를 표시하는 텍스트 스타일을 정의
 */
export const InfoText = styled.div`
  color: #6b7280;
  font-size: 13px;
`;

/**
 * 시간 정보 스타일 컴포넌트
 * 시간 관련 정보를 표시하는 텍스트 스타일을 정의
 */
export const TimeInfo = styled.div`
  color: #6b7280;
  font-size: 13px;
`;

/**
 * 다운로드 셀 스타일 컴포넌트
 * 다운로드 버튼이 있는 셀의 스타일을 정의
 */
export const DownloadCell = styled.td`
  padding: 12px 16px;
  text-align: center;
  vertical-align: middle;
`;
