import { useState } from 'react';
import type { ReactElement } from 'react';
import Simulator from '@/features/dashboard/components/Simulator/Simulator';
import RealTimeMetrics from '@/features/dashboard/components/RealTimeMetrics/RealTimeMetrics';
import ExperimentControl from './components/ExperimentControl/ExperimentControl';
import ExperimentInfo from "@/features/dashboard/components/ExperimentInfo/ExperimentInfo";
import {
  DashboardContainer,
  BodyGrid,
  TabBar,
  TabButton,
  ContentArea,
  LeftPanel,
  RightColumn,
  HeaderArea,
} from '@/shared/components/styles';
import { useRunIdFromUrl } from './hooks/useRunIdFromUrl';

/**
 * 대시보드 메인 컴포넌트
 * 실험 제어, 시뮬레이터, 실시간 메트릭을 통합하여 제공
 * 사용자는 시뮬레이터와 실시간 정보 탭을 전환할 수 있음
 */
export default function Dashboard(): ReactElement {
  const [selected, setSelected] = useState<"simulator" | "metrics">("simulator");

  useRunIdFromUrl();

  return (
    <DashboardContainer>

      <BodyGrid>
        <LeftPanel>
          <ExperimentInfo />
        </LeftPanel>
        
        <HeaderArea>
          <ExperimentControl />
        </HeaderArea>

        <RightColumn>
          <TabBar>
            <TabButton
              $active={selected === "simulator"}
              onClick={() => setSelected("simulator")}
            >
            시뮬레이터
            </TabButton>
            <TabButton
              $active={selected === "metrics"}
              onClick={() => setSelected("metrics")}
            >
              실시간 정보
            </TabButton>
          </TabBar>

          <ContentArea>
            {selected === "simulator" && <Simulator />}
            {selected === "metrics" && <RealTimeMetrics />}
          </ContentArea>
        </RightColumn>
      </BodyGrid>
    </DashboardContainer>
  );
}

