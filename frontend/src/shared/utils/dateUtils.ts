/**
 * 날짜 관련 유틸리티 함수들
 */

/**
 * 날짜 문자열을 한국어 형식으로 포맷팅하는 함수
 * @param dateString - 포맷팅할 날짜 문자열 (ISO 형식 등)
 * @returns 한국어 형식의 날짜 문자열 (예: "2024년 1월 15일")
 */
export const formatDate = (dateString: string): string => {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅하는 함수
 * @param dateString - 포맷팅할 날짜 문자열 (ISO 형식 등)
 * @returns 한국어 형식의 날짜와 시간 문자열 (예: "2024년 1월 15일 오후 2:30")
 */
export const formatDateTime = (dateString: string): string => {
  if (!dateString || dateString === '-') return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
