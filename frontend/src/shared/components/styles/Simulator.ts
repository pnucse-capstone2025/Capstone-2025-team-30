import styled from 'styled-components';

/* ===== 시뮬레이터 스타일 ===== */

export const SimulatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: min(100%, calc(50vh * 16 / 9));
  margin: 0 auto;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  background: white;
`;

export const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  max-height: 50vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: none;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  
  video {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
    display: block;
    border-radius: 4px 4px 0 0;
  }
`;

export const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: #fafbfc;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 4px 4px;
  gap: 24px;
`;

export const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const SpeedControl = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const SpeedLabel = styled.span`
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  min-width: 50px;
  letter-spacing: -0.025em;
`;

export const SpeedSlider = styled.input.attrs({ type: 'range' })`
  width: 160px;
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
  transition: all 0.2s ease;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #111 0%, #374151 100%);
    cursor: pointer;
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
    
    &:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
  
  &::-moz-range-thumb {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: linear-gradient(135deg, #111 0%, #374151 100%);
    cursor: pointer;
    border: 3px solid #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    
    &::-webkit-slider-thumb {
      cursor: not-allowed;
      background: #9ca3af;
      transform: none;
    }
    
    &::-moz-range-thumb {
      cursor: not-allowed;
      background: #9ca3af;
    }
  }
`;

export const SpeedLabels = styled.div`
  display: flex;
  justify-content: space-between;
  width: 160px;
  margin-top: 8px;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
`;

export const SpeedValue = styled.span`
  color: #111;
  font-size: 14px;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  letter-spacing: -0.025em;
`;

export const MouseLockControl = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
  
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #111;
    cursor: pointer;
    border-radius: 4px;
    
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
  
  &:has(input:disabled) {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      background: transparent;
    }
  }
`;

export const StatusIndicator = styled.div<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${props => props.$connected ? '#059669' : '#6b7280'};
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 4px;
  background: ${props => props.$connected ? '#f0fdf4' : '#f9fafb'};
  border: 1px solid ${props => props.$connected ? '#bbf7d0' : '#e5e7eb'};
  transition: all 0.2s ease;
  
  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${props => props.$connected ? '#059669' : '#6b7280'};
    animation: ${props => props.$connected ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0% { 
      opacity: 1; 
      transform: scale(1);
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.1);
    }
    100% { 
      opacity: 1; 
      transform: scale(1);
    }
  }
`;
