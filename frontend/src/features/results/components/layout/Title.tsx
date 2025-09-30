import React from 'react';

/**
 * 제목 컴포넌트의 Props 인터페이스
 */
interface TitleProps {
  /** 제목 내용 */
  children: React.ReactNode;
}

/**
 * 제목 컴포넌트
 * Results 페이지의 메인 제목을 표시
 * 
 * @param children - 제목 내용
 */
const Title: React.FC<TitleProps> = ({ children }) => {
  return (
    <h1 style={{ 
      fontSize: '24px', 
      fontWeight: 'bold',
      margin: 0,
      color: '#1f2937'
    }}>
      {children}
    </h1>
  );
};

export default Title;