import styled from 'styled-components';

export const TextEditArea = styled.textarea`
  width: 100%;
  min-height: 180px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
  
  &::placeholder {
    color: #999;
  }
`;

export const TextShowArea = styled.div`
  width: 100%;
  min-height: 180px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  background-color: #f8f9fa;
  line-height: 1.5;
  color: #495057;
  white-space: pre-wrap;
  overflow-y: auto;
  margin-bottom: 45px;
`;
