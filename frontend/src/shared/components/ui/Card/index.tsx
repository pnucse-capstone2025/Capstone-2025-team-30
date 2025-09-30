import { type ReactNode } from 'react';
import { CardContainer, CardTitle, CardContent, FlatCardContainer, HoverCardContainer } from './Card.styled';

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}

/**
 * 기본 카드 컴포넌트
 * 제목과 내용을 포함하는 표준 카드 레이아웃을 제공
 */
export default function Card({ title, children, style }: CardProps) {
  return (
    <CardContainer style={style}>
      {title && <CardTitle>{title}</CardTitle>}
      <CardContent>{children}</CardContent>
    </CardContainer>
  );
}

/**
 * 호버 효과가 있는 카드 컴포넌트
 * 마우스 호버 시 그림자와 변형 효과를 제공
 */
export function HoverCard({ title, children, style }: CardProps) {
  return (
    <HoverCardContainer style={style}>
      {title && <CardTitle>{title}</CardTitle>}
      <CardContent>{children}</CardContent>
    </HoverCardContainer>
  );
}

/**
 * 플랫 스타일 카드 컴포넌트
 * 테두리와 그림자 없이 깔끔한 플랫 디자인을 제공
 */
export function FlatCard({ title, children, style }: CardProps) {
  return (
    <FlatCardContainer style={style}>
      {title && <CardTitle>{title}</CardTitle>}
      {children}
    </FlatCardContainer>
  );
}
