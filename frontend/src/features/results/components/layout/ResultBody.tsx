import { HoverCard as Card } from "@/shared/components/ui/Card";
import styled from "styled-components";
import { useExperimentStore } from "@/store/experimentStore";
import MainCharts from "../charts/MainCharts";
import DetailedCharts from "../charts/DetailedCharts";

/**
 * 카드 콘텐츠 스타일 컴포넌트
 * 차트 카드 내부의 콘텐츠 영역을 정의
 */
const CardContent = styled.div`
  padding: 16px;
`;

/**
 * 결과 바디 컴포넌트
 * 실험 결과의 메인 차트와 상세 차트를 표시
 * 비교 모드에서는 여러 실험의 데이터를 함께 표시
 */
const ResultBody = () => {
    // 전역 상태 사용
    const resultRunDetailInfo = useExperimentStore((state) => state.resultRunDetailInfo);
    const resultMetricsData = useExperimentStore((state) => state.resultMetricsData);
    const selectedComparisons = useExperimentStore((state) => state.selectedComparisons);

    // 비교 모드인지 확인
    const isCompareMode = selectedComparisons.length > 0;

    if (!resultRunDetailInfo) {
        return (
            <Card>
                <CardContent>
                    <p>결과를 보고 싶은 실험을 선택해주세요.</p>
                </CardContent>
            </Card>
        );
    }


    // 차트 데이터 준비 함수 - 백엔드 표준화된 chartMetrics 키 사용
    const prepareChartData = (metricKey: string) => {
        const allData: any[] = [];
        
        // 메인 실험 데이터
        if (resultMetricsData?.chartData) {
            const mainData = resultMetricsData.chartData
                .map((point: any) => ({
                    x: point.x,
                    [`${resultRunDetailInfo.runName || 'Main'}`]: point[metricKey]
                }))
                .filter((point: any) => {
                    const value = point[`${resultRunDetailInfo.runName || 'Main'}`];
                    return value !== null && value !== undefined && !isNaN(value);
                });
            
            allData.push(...mainData);
        }
        
        // 비교 실험 데이터
        if (isCompareMode) {
            selectedComparisons.forEach((comparison) => {
                if (comparison.metricsData?.chartData) {
                    const compareData = comparison.metricsData.chartData
                        .map((point: any) => ({
                            x: point.x,
                            [comparison.runName]: point[metricKey]
                        }))
                        .filter((point: any) => {
                            const value = point[comparison.runName];
                            return value !== null && value !== undefined && !isNaN(value);
                        });
                    
                    // 기존 데이터와 병합
                    compareData.forEach((comparePoint: any) => {
                        const existingPoint = allData.find(p => p.x === comparePoint.x);
                        if (existingPoint) {
                            Object.assign(existingPoint, comparePoint);
                        } else {
                            allData.push(comparePoint);
                        }
                    });
                }
            });
        }
        
        return allData.sort((a, b) => a.x - b.x);
    };

    // 상세 차트 데이터 준비 함수 - indexedMetrics 사용
    const prepareDetailedChartData = (group: string, metricName: string) => {
        const allData: any[] = [];
        
        // 메인 실험 데이터
        if (resultMetricsData?.metrics) {
            const mainData = resultMetricsData.metrics
                .map((point: any) => ({
                    x: point.timesteps,
                    [`${resultRunDetailInfo.runName || 'Main'}`]: point.indexedMetrics?.[group]?.[metricName]
                }))
                .filter((point: any) => {
                    const value = point[`${resultRunDetailInfo.runName || 'Main'}`];
                    return value !== null && value !== undefined && !isNaN(value);
                });
            
            allData.push(...mainData);
        }
        
        // 비교 실험 데이터
        if (isCompareMode) {
            selectedComparisons.forEach((comparison) => {
                if (comparison.metricsData?.metrics) {
                    const compareData = comparison.metricsData.metrics
                        .map((point: any) => ({
                            x: point.timesteps,
                            [comparison.runName]: point.indexedMetrics?.[group]?.[metricName]
                        }))
                        .filter((point: any) => {
                            const value = point[comparison.runName];
                            return value !== null && value !== undefined && !isNaN(value);
                        });
                    
                    // 기존 데이터와 병합
                    compareData.forEach((comparePoint: any) => {
                        const existingPoint = allData.find(p => p.x === comparePoint.x);
                        if (existingPoint) {
                            Object.assign(existingPoint, comparePoint);
                        } else {
                            allData.push(comparePoint);
                        }
                    });
                }
            });
        }
        
        return allData.sort((a, b) => a.x - b.x);
    };


    return (
        <>
            {resultMetricsData && (
                <>
                    {/* 주요 차트 섹션 */}
                    <MainCharts
                        resultRunDetailInfo={resultRunDetailInfo}
                        selectedComparisons={selectedComparisons}
                        isCompareMode={isCompareMode}
                        prepareChartData={prepareChartData}
                    />

                    {/* 상세 차트 섹션 */}
                    <DetailedCharts
                        resultRunDetailInfo={resultRunDetailInfo}
                        resultMetricsData={resultMetricsData}
                        selectedComparisons={selectedComparisons}
                        isCompareMode={isCompareMode}
                        prepareDetailedChartData={prepareDetailedChartData}
                    />
                </>
            )}
        </>
    );
};

export default ResultBody;