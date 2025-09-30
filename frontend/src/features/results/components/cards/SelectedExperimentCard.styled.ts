import styled from 'styled-components';

/**
 * 정보 그리드 컬럼 스타일 컴포넌트
 * 실험 정보들을 세로로 배치하는 컬럼 레이아웃
 */
export const InfoColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 8px;
`;

/**
 * 정보 아이템 스타일 컴포넌트
 * 개별 정보 항목의 레이블과 값을 가로로 배치
 */
export const InfoItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
`;

/**
 * 정보 레이블 스타일 컴포넌트
 * 정보 항목의 레이블 텍스트 스타일을 정의
 */
export const InfoLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.5px;
`;

/**
 * 정보 값 스타일 컴포넌트
 * 정보 항목의 값 텍스트 스타일을 정의
 */
export const InfoValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
`;

/**
 * 메인 정보 컨테이너 스타일 컴포넌트
 * 주요 실험 정보들을 배치하는 컨테이너
 */
export const MainInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

/**
 * 메인 정보 아이템 스타일 컴포넌트
 * 주요 정보 항목의 레이아웃을 정의
 */
export const MainInfoItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

/**
 * 메인 정보 레이블 스타일 컴포넌트
 * 주요 정보의 레이블 텍스트 스타일을 정의
 */
export const MainInfoLabel = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  min-width: 80px;
`;

/**
 * 메인 정보 값 스타일 컴포넌트
 * 주요 정보의 값 텍스트 스타일을 정의
 */
export const MainInfoValue = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
`;

/**
 * 빈 공간 스타일 컴포넌트
 * 레이아웃에서 간격을 위한 빈 공간을 제공
 */
export const BlankSpace = styled.div`
  height: 8px;
`;
