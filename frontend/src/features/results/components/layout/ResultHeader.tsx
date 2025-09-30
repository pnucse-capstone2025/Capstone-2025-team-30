import Title from "./Title"
import { useState, useEffect } from "react";
import { PrimaryButton, SecondaryButton } from "@/shared/components/styles/Button";
import Modal from "../modals/Modal";
import CompareModal from "../modals/CompareModal";
import { runsApi, trainingMetricsApi } from "@/shared/api";
import { artifactsApi } from "@/shared/api";
import styled from "styled-components";
import { useExperimentStore } from "@/store/experimentStore";
import { useToastNotification } from "@/shared/hooks";
import SelectedExperimentCard from "../cards/SelectedExperimentCard";
import EnvironmentConfigCard from "../cards/EnvironmentConfigCard";
import AlgorithmConfigCard from "../cards/AlgorithmConfigCard";
import TrainingProgressCard from "../cards/TrainingProgressCard";
import ComparisonTableCard from "../cards/ComparisonTableCard";

/**
 * 런 정보 인터페이스
 */
interface Run {
  runId: string;
  runName: string;
  algorithm: string;
  environment: string;
  status: string;
  createdAt: string;
}

/**
 * 헤더 컨테이너 스타일 컴포넌트
 * 결과 헤더의 레이아웃과 스타일을 정의
 */
const HeaderContainer = styled.div`
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
  flex-shrink: 0;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    color: #333;
    font-size: 18px;
    font-weight: 600;
  }
`;

/**
 * 카드 행 레이아웃 스타일 컴포넌트
 * 실험 정보 카드들을 가로로 배치하는 레이아웃
 */
const Row = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  width: 100%;
  margin-bottom: 24px;
  
  > * {
    flex: 1;
  }
`;



/**
 * 결과 헤더 컴포넌트
 * 실험 선택, 비교 모드, 실험 정보 카드들을 관리
 * 런 선택 모달과 비교 모달을 제공
 */
const ResultHeader = () => {
    const [openModal, setOpenModal] = useState(false);
    const [openCompareModal, setOpenCompareModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const { showSuccess, showError } = useToastNotification();

    // 전역 상태 사용
    const resultRunId = useExperimentStore((state) => state.resultRunId);
    const setResultRunId = useExperimentStore((state) => state.setResultRunId);
    const resultRunDetailInfo = useExperimentStore((state) => state.resultRunDetailInfo);
    const setResultRunDetailInfo = useExperimentStore((state) => state.setResultRunDetailInfo);
    const resultMetricsData = useExperimentStore((state) => state.resultMetricsData);
    const setResultMetricsData = useExperimentStore((state) => state.setResultMetricsData);
    
    // 비교 실험 관련 상태
    const selectedComparisons = useExperimentStore((state) => state.selectedComparisons);
    const setSelectedComparisons = useExperimentStore((state) => state.setSelectedComparisons);
    const clearSelectedComparisons = useExperimentStore((state) => state.clearSelectedComparisons);

    const openFor = () => {
        setOpenModal(true);
    };
    const closeModal = () => {
        setOpenModal(false);
    };

    const handleOpenCompareModal = () => {
        setOpenCompareModal(true);
    };
    const closeCompareModal = () => {
        setOpenCompareModal(false);
    };

    const handleRunSelect = (run: Run) => {
        console.log('Selected run:', run);
        setResultRunId(run.runId); // 전역 상태에 runId 저장
        // 단일 런 선택 시 비교 런 목록 초기화
        clearSelectedComparisons();
    };

    const handleConfirmComparisons = async (selectedRuns: Run[]) => {
        try {
            setLoading(true);
            const comparisons = [];
            
            // 각 선택된 실험의 상세 정보를 가져옴
            for (const run of selectedRuns) {
                try {
                    const runDetailData = await runsApi.getRunInfo(run.runId);
                    const metricsData = await trainingMetricsApi.getRunDetail(run.runId);
                    
                    comparisons.push({
                        runId: run.runId,
                        runName: run.runName,
                        algName: run.algorithm,
                        runDetailInfo: runDetailData,
                        metricsData: metricsData.data
                    });
                } catch (error) {
                    console.error(`Failed to fetch data for run ${run.runId}:`, error);
                    showError(`실험 ${run.runName}의 데이터를 불러오는데 실패했습니다.`);
                }
            }
            
            setSelectedComparisons(comparisons);
            showSuccess(`${comparisons.length}개의 실험을 비교합니다.`);
        } catch (error) {
            console.error('Failed to load comparison data:', error);
            showError('비교 실험 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadModel = async (runName: string) => {
        try {
          const result = await artifactsApi.downloadModel(runName);
          if (result.success) {
            showSuccess('모델 다운로드를 시작합니다.');
          } else {
            showError('모델 파일이 존재하지 않습니다.');
          }
        } catch (error) {
          showError('모델 다운로드에 실패했습니다.');
          console.error('Error downloading model:', error);
        }
      };

    const handleDownloadLogs = async (runName: string) => {
        try {
          const result = await artifactsApi.downloadLogs(runName);
          if (result.success) {
            showSuccess('로그 다운로드를 시작합니다.');
          } else {
            showError('로그 파일이 존재하지 않습니다.');
          }
        } catch (error) {
          showError('로그 다운로드에 실패했습니다.');
          console.error('Error downloading logs:', error);
        }
    };

    // resultRunId가 변경될 때마다 데이터 fetch
    useEffect(() => {
        if (resultRunId) {
            const loadData = async () => {
                try {
                    setLoading(true);
                    
                    // 런 상세 정보 fetch
                    const runDetailData = await runsApi.getRunInfo(resultRunId);
                    setResultRunDetailInfo(runDetailData);
                    
                    // 메트릭 데이터 fetch
                    const metricsData = await trainingMetricsApi.getRunDetail(resultRunId);
                    setResultMetricsData(metricsData.data);
                    
                } catch (error) {
                    console.error('Failed to fetch data:', error);
                    setResultRunDetailInfo(null);
                    setResultMetricsData(null);
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        }
    }, [resultRunId, setResultRunDetailInfo, setResultMetricsData]);


    // 선택된 런 정보 (전역 상태에서 가져옴)
    const selectedRun = resultRunId && resultRunDetailInfo ? {
        runId: resultRunDetailInfo.runId,
        runName: resultRunDetailInfo.runName,
        algorithm: resultRunDetailInfo.algName,
        environment: resultRunDetailInfo.envName,
        status: resultRunDetailInfo.status,
        createdAt: resultRunDetailInfo.createdAt
    } : null;

    // 비교 모드인지 확인 (새로운 비교 모드)
    const isCompareMode = selectedComparisons.length > 0;

    return(
        <>
        <HeaderContainer>
          <Title>실험 결과</Title>
            <div style={{display:'flex', gap:8}}>
              <PrimaryButton 
                onClick={()=>openFor()}
                style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}
              >
                런 선택
              </PrimaryButton>
              <SecondaryButton onClick={()=>handleOpenCompareModal()} disabled={!selectedRun}>
                런 비교
              </SecondaryButton>
              {isCompareMode && (
                <SecondaryButton onClick={()=>clearSelectedComparisons()}>
                  비교 초기화
                </SecondaryButton>
              )}
            </div>
        </HeaderContainer>
            
            {selectedRun ? (
              isCompareMode ? (
                // 새로운 비교 모드: 테이블 형태로 모든 실험 표시
                <ComparisonTableCard
                  selectedComparisons={selectedComparisons}
                  mainExperiment={selectedRun}
                  mainExperimentDetail={resultRunDetailInfo}
                  loading={loading}
                  onDownloadModel={handleDownloadModel}
                  onDownloadLogs={handleDownloadLogs}
                />
              ) : (
                // 단일 실험 모드: 4개 카드 표시
                <Row>
                  <SelectedExperimentCard
                    selectedRun={selectedRun}
                    resultRunDetailInfo={resultRunDetailInfo}
                    loading={loading}
                    onDownloadModel={handleDownloadModel}
                    onDownloadLogs={handleDownloadLogs}
                  />
                  
                  <EnvironmentConfigCard
                    envConfig={resultRunDetailInfo?.envConfig}
                  />
                  
                  <AlgorithmConfigCard
                    algConfig={resultRunDetailInfo?.algConfig}
                  />

                  <TrainingProgressCard
                    resultMetricsData={resultMetricsData}
                  />
                </Row>
              )
            ) : (
              <span></span>
            )}

            {openModal ? <Modal onClose={closeModal} onSelectRun={handleRunSelect}/> : null}
            {openCompareModal ? (
              <CompareModal 
                onClose={closeCompareModal} 
                onConfirmComparisons={handleConfirmComparisons}
                envName={resultRunDetailInfo?.envName || ''}
                baseRunId={resultRunDetailInfo?.runId} // 비교 기준 실험 ID 전달
              /> 
            ) : null}

        </>
    )
}
export default ResultHeader;
