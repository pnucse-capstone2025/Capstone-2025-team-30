import React from 'react';
import { HoverCard as Card } from "@/shared/components/ui/Card";
import { ActionButtons } from "@/features/results/components/common/ActionButton";
import { StatusBadge } from "@/shared/components";
import { 
  Table, 
  TableHeader, 
  TableHeaderCell, 
  TableBody, 
  TableRow, 
  TableCell, 
  ExperimentName, 
  InfoText, 
  TimeInfo, 
  DownloadCell 
} from "./ComparisonTableCard.styled";

/**
 * 비교 테이블 카드 컴포넌트의 Props 인터페이스
 */
interface ComparisonTableCardProps {
  /** 비교할 실험들의 배열 */
  selectedComparisons: Array<{
    runId: string;
    runName: string;
    algName: string;
    runDetailInfo: any;
    metricsData: any;
  }>;
  /** 메인 실험 정보 */
  mainExperiment: {
    runId: string;
    runName: string;
    algorithm: string;
    environment: string;
    status: string;
    createdAt: string;
  } | null;
  /** 메인 실험 상세 정보 */
  mainExperimentDetail: any;
  /** 로딩 상태 */
  loading: boolean;
  /** 모델 다운로드 핸들러 */
  onDownloadModel: (runName: string) => void;
  /** 로그 다운로드 핸들러 */
  onDownloadLogs: (runName: string) => void;
}

/**
 * 비교 테이블 카드 컴포넌트
 * 선택된 실험들을 테이블 형태로 비교하여 표시합니다.
 * 메인 실험과 비교 실험들의 정보를 한눈에 볼 수 있도록 제공합니다.
 * 
 * @param selectedComparisons - 비교할 실험들의 배열
 * @param mainExperiment - 메인 실험 정보
 * @param mainExperimentDetail - 메인 실험 상세 정보
 * @param loading - 로딩 상태
 * @param onDownloadModel - 모델 다운로드 핸들러
 * @param onDownloadLogs - 로그 다운로드 핸들러
 */
const ComparisonTableCard: React.FC<ComparisonTableCardProps> = ({
  selectedComparisons,
  mainExperiment,
  mainExperimentDetail,
  loading,
  onDownloadModel,
  onDownloadLogs
}) => {
  // 총 학습 시간 계산 함수
  const calculateDuration = (startTime: string, endTime?: string): string | null => {
    if (!startTime) return null;
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 0) return null;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes}분 ${seconds}초`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds}초`;
    } else {
      return `${seconds}초`;
    }
  };

  // 모든 실험 데이터를 하나의 배열로 합치기 (메인 실험 + 비교 실험들)
  const allExperiments = [];
  
  // 메인 실험 추가
  if (mainExperiment && mainExperimentDetail) {
    allExperiments.push({
      runId: mainExperiment.runId,
      runName: mainExperiment.runName,
      algorithm: mainExperiment.algorithm,
      environment: mainExperiment.environment,
      status: mainExperiment.status,
      createdAt: mainExperiment.createdAt,
      startTime: mainExperimentDetail.startTime,
      endTime: mainExperimentDetail.endTime,
      isMain: true
    });
  }
  
  // 비교 실험들 추가
  selectedComparisons.forEach(comparison => {
    allExperiments.push({
      runId: comparison.runId,
      runName: comparison.runName,
      algorithm: comparison.algName,
      environment: comparison.runDetailInfo?.envName || 'Unknown',
      status: comparison.runDetailInfo?.status || 'Unknown',
      createdAt: comparison.runDetailInfo?.createdAt || 'Unknown',
      startTime: comparison.runDetailInfo?.startTime,
      endTime: comparison.runDetailInfo?.endTime,
      isMain: false
    });
  });

  if (allExperiments.length === 0) {
    return null;
  }

  return (
    <Card>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>런 이름</TableHeaderCell>
              <TableHeaderCell>환경</TableHeaderCell>
              <TableHeaderCell>알고리즘</TableHeaderCell>
              <TableHeaderCell>시작 시간</TableHeaderCell>
              <TableHeaderCell>총 학습 시간</TableHeaderCell>
              <TableHeaderCell>상태</TableHeaderCell>
              <TableHeaderCell>다운로드</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {allExperiments.map((experiment) => (
              <TableRow key={experiment.runId}>
                <TableCell>
                  <ExperimentName>
                    {experiment.runName}
                  </ExperimentName>
                </TableCell>
                <TableCell>
                  <InfoText>{experiment.environment.toUpperCase()}</InfoText>
                </TableCell>
                <TableCell>
                  <InfoText>{experiment.algorithm.toUpperCase()}</InfoText>
                </TableCell>
                <TableCell>
                  <TimeInfo>
                    {experiment.startTime 
                      ? new Date(experiment.startTime).toLocaleString() 
                      : 'N/A'
                    }
                  </TimeInfo>
                </TableCell>
                <TableCell>
                  <TimeInfo>
                    {calculateDuration(experiment.startTime, experiment.endTime) || 'N/A'}
                  </TimeInfo>
                </TableCell>
                <TableCell>
                  <StatusBadge status={experiment.status} />
                </TableCell>
                <DownloadCell>
                <ActionButtons
                  onDownloadModel={onDownloadModel}
                  onDownloadLogs={onDownloadLogs}
                  runName={experiment.runName}
                  runId={experiment.runId}
                  status={experiment.status}
                  loading={loading}
                  buttonWidth="90px"
                />
                </DownloadCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
    </Card>
  );
};

export default ComparisonTableCard;
