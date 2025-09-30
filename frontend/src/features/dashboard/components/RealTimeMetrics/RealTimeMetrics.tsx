import { FlatCard } from '@/shared/components/ui/Card';
import { useExperimentStore } from '@/store/experimentStore';
import { MetricLineChart } from '@/shared/components/ui/Chart/MetricLineChart';
import { UILogger } from '@/shared/utils/logger';
import { 
  MetricsContainer, 
  MetricsGrid, 
  ChartContainer, 
  ChartTitle, 
  ChartWrapper 
} from './RealTimeMetrics.styled';

/**
 * 차트 데이터 다운샘플링 함수
 * 성능 최적화를 위해 데이터 포인트 수를 제한
 * @param data - 다운샘플링할 데이터 배열
 * @param maxPoints - 최대 포인트 수 (기본값: 1000)
 * @returns 다운샘플링된 데이터 배열
 */
function downsample<T>(data: T[], maxPoints = 1000): T[] {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * 실시간 메트릭 컴포넌트
 * 훈련 중인 실험의 실시간 메트릭을 차트로 표시
 * Reward, Loss, Exploration Rate, Episode Length 등의 지표를 모니터링할 수 있음
 */
export default function RealTimeMetrics() {
  // 훈련 메트릭 데이터
  const trainingMetrics = useExperimentStore((state) => state.trainingMetrics);
  UILogger.state('RealTimeMetrics', { count: trainingMetrics.length });

  // timesteps를 x축으로 사용하도록 데이터 변환
  const chartData = downsample(
    trainingMetrics.map(metric => ({
      x: metric.timesteps,
      reward: metric.reward,
      loss: metric.loss,
      exploration: metric.exploration,
      efficiency: metric.efficiency
    }))
  );
  
  UILogger.state('RealTimeMetrics-chartData', { length: chartData.length });

  return (
    <FlatCard style={{ height: '100%' }}>
      <MetricsContainer>
        <MetricsGrid>
          <ChartContainer>
            <ChartTitle>Reward</ChartTitle>
            <ChartWrapper>
              <MetricLineChart
                data={chartData}
                lines={[{ dataKey: 'reward', stroke: '#43d9ad', name: 'Reward' }]}
                xAxisLabel="Steps"
                yAxisLabel="Reward"
                height="100%"
              />
            </ChartWrapper>
          </ChartContainer>
          
          <ChartContainer>
            <ChartTitle>Loss</ChartTitle>
            <ChartWrapper>
              <MetricLineChart
                data={chartData}
                lines={[{ dataKey: 'loss', stroke: '#ff6b35', name: 'Loss' }]}
                xAxisLabel="Steps"
                yAxisLabel="Loss"
                height="100%"
              />
            </ChartWrapper>
          </ChartContainer>
          
          <ChartContainer>
            <ChartTitle>Exploration Rate</ChartTitle>
            <ChartWrapper>
              <MetricLineChart
                data={chartData}
                lines={[{ dataKey: 'exploration', stroke: '#4285f4', name: 'Exploration' }]}
                xAxisLabel="Steps"
                yAxisLabel="Rate"
                height="100%"
              />
            </ChartWrapper>
          </ChartContainer>
          
          <ChartContainer>
            <ChartTitle>Episode Length</ChartTitle>
            <ChartWrapper>
              <MetricLineChart
                data={chartData}
                lines={[{ dataKey: 'efficiency', stroke: '#f39c12', name: 'Episode Length' }]}
                xAxisLabel="Steps"
                yAxisLabel="Steps"
                height="100%"
              />
            </ChartWrapper>
          </ChartContainer>
        </MetricsGrid>
      </MetricsContainer>
    </FlatCard>
  );
}