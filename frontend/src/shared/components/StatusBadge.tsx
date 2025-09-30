import React from 'react';
import styled from 'styled-components';

/**
 * 상태 배지 스타일 컴포넌트
 * 상태에 따라 다른 색상과 스타일을 적용하는 배지
 */
const StatusBadgeStyled = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  
  ${({ $status }) => {
    switch ($status.toLowerCase()) {
      case 'completed':
        return `
          background-color: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
        `;
      case 'running':
      case 'paused':
        return `
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
      case 'failed':
        return `
          background-color: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        `;
      case 'stopped':
        return `
          background-color: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
        `;
      default:
        return `
          background-color: #f3f4f6;
          color: #6b7280;
          border: 1px solid #d1d5db;
        `;
    }
  }}
`;

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
}

/**
 * 상태 배지 컴포넌트
 * 다양한 상태에 따라 색상과 스타일이 변경되는 배지
 * @param status - 표시할 상태 문자열
 * @param children - 커스텀 텍스트 (선택사항, 없으면 status를 사용)
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children }) => {
  return (
    <StatusBadgeStyled $status={status}>
      {children || status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </StatusBadgeStyled>
  );
};

export default StatusBadge;
