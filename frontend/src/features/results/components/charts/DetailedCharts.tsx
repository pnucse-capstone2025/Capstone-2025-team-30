import React, { useState, useMemo, useCallback } from "react";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import DetailedChartsHeader from "./DetailedChartsHeader";
import DetailedChartsGrid from "./DetailedChartsGrid";
import { CardContent, DetailedChartsSection, DetailedChartCard } from "./DetailedCharts.styled";

/**
 * 상세 차트 컴포넌트의 Props 인터페이스
 */
interface DetailedChartsProps {
  /** 실험 상세 정보 */
  resultRunDetailInfo: any;
  /** 메트릭 데이터 */
  resultMetricsData: any;
  /** 선택된 비교 실험들 */
  selectedComparisons: any[];
  /** 비교 모드 여부 */
  isCompareMode: boolean;
  /** 상세 차트 데이터 준비 함수 */
  prepareDetailedChartData: (group: string, metricName: string) => any[];
}

/**
 * 상세 차트 컴포넌트
 * 모든 메트릭을 그룹별로 분류하여 상세 차트로 표시
 * 확장/축소 기능을 통해 공간을 효율적으로 사용
 * 
 * @param resultRunDetailInfo - 실험 상세 정보
 * @param resultMetricsData - 메트릭 데이터
 * @param selectedComparisons - 선택된 비교 실험들
 * @param isCompareMode - 비교 모드 여부
 * @param prepareDetailedChartData - 상세 차트 데이터 준비 함수
 */
const DetailedCharts: React.FC<DetailedChartsProps> = ({
  resultRunDetailInfo,
  resultMetricsData,
  selectedComparisons,
  isCompareMode,
  prepareDetailedChartData
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  // 상세 차트 생성 함수 - useMemo로 최적화
  const generateDetailedCharts = useMemo(() => {
    if (!resultMetricsData?.metrics || resultMetricsData.metrics.length === 0) {
      return [];
    }

    const charts: React.ReactElement[] = [];
    const allGroups = new Set<string>();
    const allMetrics = new Map<string, Set<string>>();

    // 메인 실험의 모든 메트릭을 순회해서 모든 그룹과 메트릭을 수집
    resultMetricsData.metrics.forEach((metric: any) => {
      if (metric.indexedMetrics) {
        Object.entries(metric.indexedMetrics).forEach(([group, metrics]) => {
          allGroups.add(group);
          if (!allMetrics.has(group)) {
            allMetrics.set(group, new Set());
          }
          if (typeof metrics === 'object' && metrics !== null) {
            Object.keys(metrics).forEach((metricName) => {
              allMetrics.get(group)!.add(metricName);
            });
          }
        });
      }
    });

    // 비교 실험의 모든 메트릭도 수집
    if (isCompareMode) {
      selectedComparisons.forEach((comparison) => {
        if (comparison.metricsData?.metrics) {
          comparison.metricsData.metrics.forEach((metric: any) => {
            if (metric.indexedMetrics) {
              Object.entries(metric.indexedMetrics).forEach(([group, metrics]) => {
                allGroups.add(group);
                if (!allMetrics.has(group)) {
                  allMetrics.set(group, new Set());
                }
                if (typeof metrics === 'object' && metrics !== null) {
                  Object.keys(metrics).forEach((metricName) => {
                    allMetrics.get(group)!.add(metricName);
                  });
                }
              });
            }
          });
        }
      });
    }

    // 각 그룹별로 차트 생성 (time 그룹 제외)
    allGroups.forEach((group) => {
      // time 그룹은 차트에서 제외
      if (group === 'time') return;
      
      const metrics = allMetrics.get(group);
      if (metrics) {
        metrics.forEach((metricName) => {
          const chartData = prepareDetailedChartData(group, metricName);
          
          if (chartData.length === 0) return;
          
          // 데이터가 있는 실험만 필터링
          const experimentsWithData = getExperimentsWithData(chartData);
          
          if (experimentsWithData.length === 0) return;
          
          charts.push(
            <DetailedChartCard key={`${group}-${metricName}`}>
              <CardTitle>{`${group} - ${metricName}`}</CardTitle>
              <CardContent>
                <div style={{ width: '100%', height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData} 
                      margin={{ top: 10, right: 24, bottom: 28, left: 56 }}
                      width={400}
                      height={250}
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
            </DetailedChartCard>
          );
        });
      }
    });

    return charts;
  }, [resultMetricsData, selectedComparisons, isCompareMode, prepareDetailedChartData, getExperimentsWithData]);

  return (
    <DetailedChartsSection>
      <DetailedChartsHeader 
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      <DetailedChartsGrid isExpanded={isExpanded}>
        {generateDetailedCharts}
      </DetailedChartsGrid>
    </DetailedChartsSection>
  );
};

export default React.memo(DetailedCharts);
