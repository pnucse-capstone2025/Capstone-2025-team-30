import React, { useMemo, useCallback } from "react";
import { HoverCard as Card } from "@/shared/components/ui/Card";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CardContent, MetricsGrid } from "./MainCharts.styled";

/**
 * 메인 차트 컴포넌트의 Props 인터페이스
 */
interface MainChartsProps {
  /** 실험 상세 정보 */
  resultRunDetailInfo: any;
  /** 선택된 비교 실험들 */
  selectedComparisons: any[];
  /** 비교 모드 여부 */
  isCompareMode: boolean;
  /** 차트 데이터 준비 함수 */
  prepareChartData: (metricKey: string) => any[];
}

/**
 * 메인 차트 컴포넌트
 * 주요 메트릭 4개(Reward, Loss, Exploration Rate, Efficiency)를 2x2 그리드로 표시
 * 비교 모드에서는 여러 실험의 데이터를 함께 표시
 * 
 * @param resultRunDetailInfo - 실험 상세 정보
 * @param selectedComparisons - 선택된 비교 실험들
 * @param isCompareMode - 비교 모드 여부
 * @param prepareChartData - 차트 데이터 준비 함수
 */
const MainCharts: React.FC<MainChartsProps> = ({
  resultRunDetailInfo,
  selectedComparisons,
  isCompareMode,
  prepareChartData
}) => {
  // 주요 메트릭 4개 정의 - 백엔드 표준화된 chartMetrics 키 사용
  const mainMetrics = useMemo(() => [
    { 
      key: 'reward', 
      name: 'Reward', 
      color: '#8884d8' 
    },
    { 
      key: 'loss', 
      name: 'Loss', 
      color: '#ef4444' 
    },
    { 
      key: 'exploration', 
      name: 'Exploration Rate', 
      color: '#10b981' 
    },
    { 
      key: 'efficiency', 
      name: 'Episode Length', 
      color: '#f59e0b' 
    }
  ], []);

  // 데이터가 있는 실험만 필터링하는 함수
  const getExperimentsWithData = useCallback((chartData: any[]) => {
    const experimentsWithData = [];
    
    // 메인 실험 확인
    const mainRunName = resultRunDetailInfo.runName || 'Main';
    const hasMainData = chartData.some(point => 
      point[mainRunName] !== null && 
      point[mainRunName] !== undefined && 
      !isNaN(point[mainRunName])
    );
    
    if (hasMainData) {
      experimentsWithData.push({
        runName: mainRunName,
        runId: 'main',
        color: '#dc2626'
      });
    }
    
    // 비교 실험들 확인
    if (isCompareMode) {
      const colors = ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b', '#8b5cf6'];
      selectedComparisons.forEach((comparison, idx) => {
        const hasCompareData = chartData.some(point => 
          point[comparison.runName] !== null && 
          point[comparison.runName] !== undefined && 
          !isNaN(point[comparison.runName])
        );
        
        if (hasCompareData) {
          experimentsWithData.push({
            runName: comparison.runName,
            runId: comparison.runId,
            color: colors[idx % colors.length]
          });
        }
      });
    }
    
    return experimentsWithData;
  }, [resultRunDetailInfo.runName, selectedComparisons, isCompareMode]);

  return (
    <MetricsGrid>
      {mainMetrics.map((metric) => {
        const chartData = prepareChartData(metric.key);
        
        if (chartData.length === 0) return null;
        
        // 데이터가 있는 실험만 필터링
        const experimentsWithData = getExperimentsWithData(chartData);
        
        if (experimentsWithData.length === 0) return null;
        
        return (
          <Card key={metric.name}>
            <CardTitle>{metric.name}</CardTitle>
            <CardContent>
              <div style={{ width: '100%', height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={chartData} 
                    margin={{ top: 10, right: 24, bottom: 28, left: 56 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="x" 
                      tickMargin={8}
                      label={{ value: 'Steps', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis tickMargin={8} />
                    <Tooltip 
                      labelFormatter={(label: any) => `Step: ${label}`}
                      formatter={(value: any, name: string) => [
                        typeof value === 'number' ? value.toFixed(4) : value, 
                        name
                      ]}
                    />
                    <Legend />
                    
                    {/* 데이터가 있는 실험들만 렌더링 */}
                    {experimentsWithData.map((experiment) => (
                      <Line 
                        key={experiment.runId}
                        type="monotone" 
                        dataKey={experiment.runName}
                        name={experiment.runName}
                        stroke={experiment.color}
                        strokeWidth={2} 
                        connectNulls={true}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </MetricsGrid>
  );
};

export default React.memo(MainCharts);
