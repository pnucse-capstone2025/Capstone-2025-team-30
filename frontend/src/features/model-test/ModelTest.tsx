import TestSimulator from '@/features/model-test/components/TestSimulator/TestSimulator';
import TestModelControl from "@/features/model-test/components/TestControl/TestModelControl";
import TestModelInfo from "@/features/model-test/components/TestInfo/TestModelInfo";
import {
  DashboardContainer,
  BodyGrid,
  TabBar,
  TabButton,
  ContentArea,
  LeftPanel,
  RightColumn,
  HeaderArea
} from '@/shared/components/styles';

/**
 * 모델 테스트 메인 컴포넌트
 * 모델 테스트 기능을 위한 전체 레이아웃을 구성
 * 좌측 패널에 모델 정보, 상단에 테스트 제어, 우측에 시뮬레이터를 배치
 * 
 * @returns JSX.Element
 */
export default function ModelTest() {
  return (
    <DashboardContainer>
      <BodyGrid>
        {/* 좌측 패널: 모델 정보 및 파라미터 */}
        <LeftPanel>
          <TestModelInfo />
        </LeftPanel>
        
        {/* 상단 헤더: 테스트 제어 버튼들 */}
        <HeaderArea>
          <TestModelControl />
        </HeaderArea>

        {/* 우측 컬럼: 시뮬레이터 영역 */}
        <RightColumn>
          {/* 탭 바: 시뮬레이터 탭 (현재 고정) */}
          <TabBar>
            <TabButton $active={true}>
              시뮬레이터
            </TabButton>
          </TabBar>

          {/* 콘텐츠 영역: WebRTC 시뮬레이터 */}
          <ContentArea>
            <TestSimulator />
          </ContentArea>
        </RightColumn>
      </BodyGrid>
    </DashboardContainer>
  );
}

