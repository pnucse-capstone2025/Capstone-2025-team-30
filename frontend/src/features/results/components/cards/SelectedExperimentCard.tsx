import React from 'react';
import { HoverCard as Card } from "@/shared/components/ui/Card";
import CardTitle from "@/features/results/components/common/CardTitle.styled";
import { ActionButtons } from "@/features/results/components/common/ActionButton";
import { StatusBadge } from "@/shared/components";
import { formatDateTime } from "@/shared/utils/dateUtils";
import { 
  InfoColumn, 
  InfoItem, 
  InfoLabel, 
  InfoValue, 
  MainInfo, 
  MainInfoItem, 
  MainInfoLabel, 
  MainInfoValue, 
  BlankSpace 
} from "./SelectedExperimentCard.styled";

/**
 * 선택된 실험 카드 컴포넌트의 Props 인터페이스
 */
interface SelectedExperimentCardProps {
  /** 선택된 실험 런 정보 */
  selectedRun: {
    runId: string;
    runName: string;
    algorithm: string;
    environment: string;
    status: string;
    createdAt: string;
  } | null;
  /** 실험 상세 정보 */
  resultRunDetailInfo: any;
  /** 로딩 상태 */
  loading: boolean;
  /** 모델 다운로드 핸들러 */
  onDownloadModel: (runName: string) => void;
  /** 로그 다운로드 핸들러 */
  onDownloadLogs: (runName: string) => void;
}

/**
 * 선택된 실험 카드 컴포넌트
 * 현재 선택된 실험의 상세 정보를 표시하고 액션 버튼을 제공합니다.
 * 실험명, 상태, 생성일, 학습 시간 등의 정보를 보여줍니다.
 * 
 * @param selectedRun - 선택된 실험 런 정보
 * @param resultRunDetailInfo - 실험 상세 정보
 * @param loading - 로딩 상태
 * @param onDownloadModel - 모델 다운로드 핸들러
 * @param onDownloadLogs - 로그 다운로드 핸들러
 */
const SelectedExperimentCard: React.FC<SelectedExperimentCardProps> = ({
  selectedRun,
  resultRunDetailInfo,
  loading,
  onDownloadModel,
  onDownloadLogs
}) => {
  if (!selectedRun) return null;


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

  return (
    <Card>
      <div>
        <CardTitle>런 정보</CardTitle>
        {loading ? (
          <p>상세 정보를 불러오는 중...</p>
        ) : resultRunDetailInfo ? (
          <div>
            {/* 주요 정보 */}
            <MainInfo>
              <MainInfoItem>
                <MainInfoLabel>런 이름</MainInfoLabel>
                <MainInfoValue>{selectedRun.runName}</MainInfoValue>
              </MainInfoItem>
              <MainInfoItem>
                <MainInfoLabel>환경</MainInfoLabel>
                <MainInfoValue>{resultRunDetailInfo.envName.toUpperCase()}</MainInfoValue>
              </MainInfoItem>
              <MainInfoItem>
                <MainInfoLabel>알고리즘</MainInfoLabel>
                <MainInfoValue>{resultRunDetailInfo.algName.toUpperCase()}</MainInfoValue>
              </MainInfoItem>
            </MainInfo>
            {/* 상세 정보 그리드 */}
            <InfoColumn>
              <InfoItem>
                <InfoLabel>시작 시간</InfoLabel>
                <InfoValue>
                  {resultRunDetailInfo.startTime ? formatDateTime(resultRunDetailInfo.startTime) : 'N/A'}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>총 학습 시간</InfoLabel>
                <InfoValue>{calculateDuration(resultRunDetailInfo.startTime, resultRunDetailInfo.endTime)}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>상태</InfoLabel>
                <InfoValue>
                  <StatusBadge status={resultRunDetailInfo.status} />
                </InfoValue>
              </InfoItem>
            </InfoColumn>
            
            {/* 다운로드 버튼 영역 */}
            <BlankSpace />
            <ActionButtons
              onDownloadModel={onDownloadModel}
              onDownloadLogs={onDownloadLogs}
              runName={resultRunDetailInfo.runName}
              runId={resultRunDetailInfo.runId}
              status={resultRunDetailInfo.status}
              loading={loading}
              buttonWidth="90px"
            />
          </div>
        ) : (
          <p>상세 정보를 불러올 수 없습니다.</p>
        )}
      </div>
    </Card>
  );
};

export default SelectedExperimentCard;
