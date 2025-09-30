import React from 'react';
import { HoverCard as Card } from "@/shared/components/ui/Card";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { 
  ProgressInfo, 
  ProgressContainer, 
  ChartWrapper, 
  ProgressText, 
  ErrorMessage 
} from "./TrainingProgressCard.styled";

/**
 * 학습 진행률 카드 컴포넌트의 Props 인터페이스
 */
interface TrainingProgressCardProps {
  /** 메트릭 데이터 객체 */
  resultMetricsData: any;
}

/**
 * 학습 진행률 카드 컴포넌트
 * 실험의 학습 진행률을 원형 차트로 시각화하여 표시합니다.
 * 현재 스텝과 전체 스텝, 진행률 퍼센트를 보여줍니다.
 * 
 * @param resultMetricsData - 메트릭 데이터 객체
 */
const TrainingProgressCard: React.FC<TrainingProgressCardProps> = ({ resultMetricsData }) => {
  return (
    <Card>
      <div style={{ overflow: 'hidden' }}>
        <CardTitle>학습 진행 상황</CardTitle>

        {resultMetricsData && (
          <ProgressInfo>
            현재 스텝: {Number(resultMetricsData.currentProgress ?? 0).toLocaleString()} {resultMetricsData.totalSteps ? `/ ${Number(resultMetricsData.totalSteps).toLocaleString()}` : ''}
          </ProgressInfo>
        )}
        
        {resultMetricsData ? (
          <ProgressContainer>
            {(() => {
              const rawProgress = resultMetricsData.totalSteps ? (resultMetricsData.currentProgress / resultMetricsData.totalSteps) * 100 : 0;
              const progress = Math.max(0, Math.min(rawProgress, 100));
              const radius = 130; // visual size
              const strokeWidth = 22;
              const normalizedRadius = radius - strokeWidth * 2;
              const circumference = normalizedRadius * 2 * Math.PI;
              const strokeDasharray = `${circumference} ${circumference}`;
              const strokeDashoffset = circumference - (progress / 100) * circumference;
              const ringColor = progress <= 30 ? '#ef4444' : progress <= 60 ? '#f59e0b' : '#22c55e';
              
              return (
                <ChartWrapper $radius={radius}>
                  <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
                    <circle stroke="#e6e6e6" fill="transparent" strokeWidth={strokeWidth} r={normalizedRadius} cx={radius} cy={radius} />
                    <circle
                      stroke={ringColor}
                      fill="transparent"
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      r={normalizedRadius}
                      cx={radius}
                      cy={radius}
                      style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                  </svg>
                  <ProgressText>
                    {Math.round(rawProgress)}%
                  </ProgressText>
                </ChartWrapper>
              );
            })()}
          </ProgressContainer>
        ) : (
          <ErrorMessage>메트릭 데이터를 불러오는 중이거나 아직 없습니다.</ErrorMessage>
        )}
      </div>
    </Card>
  );
};

export default TrainingProgressCard;
