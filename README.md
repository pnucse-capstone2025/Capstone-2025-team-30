### 1. 프로젝트 배경

#### 1.1. 국내외 시장 현황 및 문제점

최근 자율주행 자동차, 스마트 팩토리, 이족보행 로봇 등 다양한 분야에서 인공지능의 중요성이 커지고 있습니다. 인공지능 학습 방식 중 **강화학습(RL)** 은 대표적인 방법으로, 정답 레이블 없이 시행착오를 통해 스스로 **정책(policy)** 을 개선합니다.
강화학습은 **사전지식 없이도 자율 학습 가능**하다는 장점이 있으나, **학습 시간과 시뮬레이션 비용이 매우 크다**는 한계가 존재합니다. 초기에는 다양한 예외 상황에서 실패를 반복하며 학습 진전이 느리기 때문입니다.

#### 1.2. 필요성과 기대효과

본 과제는 강화학습 중에도 **지도 신호**를 제공하여 학습 효율을 높이는 접근입니다.

* **실시간 사용자 피드백(LLM 연동)**: 상황별 행동을 **긍정/중립/부정**으로 피드백
* **Behavior Cloning(BC)**: 사전 정의된 “올바른 선택”을 모사
* **기대효과**: **학습 시간 단축**, **안정적 성능 향상**, **데이터/연산 자원 절감**

---

### 2. 연구 목표

#### 2.1. 목표 및 세부 내용

* 사용자의 실시간 피드백을 **정량화(긍/중/부)** 하여 학습에 반영 → **정책 수렴 가속**
* **BC + RL** 혼합으로 **짧은 시간/적은 자원**으로 **동등 이상의 성능** 확보
* Unity 환경에 알고리즘 **안정 이식**, **ML-Agents ⇄ Gym** 래핑으로 재사용성 확보
* **웹 대시보드**에서 실험 **생성–제어–관찰–분석–산출물 관리** 일원화
  → **재현성**과 **시연 효율** 동시 확보

---

### 3. 시스템 설계

#### 3.1. 시스템 구성도

<img width="1920" height="1080" alt="simulator (3)" src="https://github.com/user-attachments/assets/6f85494b-1504-40d4-906c-11e316d55dc0" />

#### 3.2. 사용 기술

| 분야              | 기술/스택                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **강화학습 모델**     | Python 3.13.2, PyTorch 2.7.1, TorchVision 0.22.1, CUDA 12.6.x, cuDNN 9.5.1, Gymnasium 1.1.1 (CarRacing-v3), Stable Baselines3 2.6.0, NumPy 2.2.5, OpenCV 4.11.0.86, Pillow 11.3.0 |
| **실험 로깅·모델 관리** | TensorBoard 2.19.0 (events logs), Git LFS                                                                                                                                         |
| **LLM 모델**      | GPT-4o-mini, OpenAI Python SDK 1.107.2                                                                                                                                            |
| **시뮬레이터**       | Unity (ML-Agents), Gymnasium 1.1.1                                                                                                                                                |
| **프론트엔드**       | React, TypeScript, Vite                                                                                                                                                           |
| **백엔드**         | Node.js (Express, BFF), FastAPI 0.116.1 (강화학습 제어)                                                                                                                                 |
| **개발·배포 환경**    | Docker, Docker Compose                                                                                                                                                            |
| **데이터베이스**      | MongoDB                                                                                                                                                                           |

---

### 4. 개발 결과

#### 4.1. 전체 시스템 흐름도

1. **실험 생성**: 사용자가 웹 대시보드에서 환경/알고리즘/하이퍼파라미터 지정
2. **학습 시작**: 백엔드(BFF) → RL 제어(FastAPI)로 학습 시작 트리거
3. **실시간 모니터링**: Unity Render Streaming(WebRTC)로 실시간 화면 전송, 보상·손실·탐험률 등 메트릭 스트리밍/시각화
   - 3.1 **사용자 피드백**: 긍/중/부 피드백 입력 → LLM을 통해 정량화 → 학습에 반영
4. **결과 저장**: 학습 종료 후 모델/로그 저장, 비교·다운로드 지원

#### 4.2. 기능 설명 및 주요 기능 명세서

**기능 개요**

* `대시보드 구성`: 실험 템플릿, 실행 상태, 실시간 모니터링, 결과 확인을 한 화면에서 관리

**실험 템플릿 관리**

* `실험 생성`: 실험 이름·환경·알고리즘 선택, 환경 파리미터 / 알고리즘 하이퍼파라미터 설정
* `실험 불러오기`: 생성된 실험 목록에서 선택/삭제
* `실험 정보 표시`: 선택된 실험의 기본 정보(좌측 패널)
* `실험 노트`: 실험 관련 메모 입력 및 관리

**실험 실행 관리**

* `실험 시작` / `일시정지,재개` / `종료`
* 상태·진행률·최근 메트릭 표시

**실시간 시뮬레이터 및 모니터링**

* `비디오 플레이어`: Unity Render Streaming(WebRTC) 실시간 출력, 연결 상태 표시
* `배속 조절`: 슬라이더(느림/보통/빠름/매우빠름)
* `실시간 차트`: 보상(reward), 손실(loss), 탐험률(ε), 에피소드 길이

**모델 테스트**

* `모델 불러오기/삭제`, `모델 정보 표시`
* `테스트 실행 관리`: 시작/일시정지/재개/종료
* `실시간 시뮬레이터`: 학습과 동일한 스트리밍 (속도 조절 불가)

**결과 페이지**

* `학습 결과`: 종료된 실험 선택 → 상세 로그 차트
* `실험 비교`: 동일 환경 두 실험 나란히 비교
* `다운로드`: 모델(.zip), 로그(.csv)

#### 4.3. 디렉토리 구조

> 동건님 fast_unity 주석 확인해주세요!

```
repo-root/
├─ docs
├─ algorithms
├─ frontend/                # React + Vite 대시보드 (실험 관리 UI)
│  ├─ src/
│  │  ├─ features/         # 기능별 컴포넌트 (dashboard, model-test, results)
│  │  ├─ shared/           # 공통 컴포넌트, API 클라이언트, 유틸리티
│  │  ├─ core/             # WebRTC, 스트리밍 핵심 로직
│  │  └─ store/            # Zustand 상태 관리
│  └─ dist/                # 빌드 결과물
├─ backend/                # 백엔드 서비스들
│  ├─ api/                 # Node.js BFF (API Gateway)
│  │  └─ src/
│  │     ├─ routes/        # REST API 엔드포인트
│  │     ├─ models/        # MongoDB 스키마
│  │     └─ utils/         # 헬퍼 함수들
│  ├─ fast_unity/          # FastAPI RL 제어 서버
│  │  ├─ app/              # FastAPI 애플리케이션
│  │  ├─ unity/            # Unity 환경 및 학습 로직
│  │  │  ├─ envs/          # Unity 빌드된 환경들 (ball, car, cnn_car)
│  │  │  ├─ train/         # 학습 스크립트 (algo_registry, train_runner)
│  │  │  └─ train_util/    # 학습 유틸리티 (래퍼, 콜백, 피드백)
│  │  ├─ models/           # 학습된 모델 파일들
│  │  └─ train_logs/       # 학습 로그 및 메트릭
│  └─ signaling-server/    # WebRTC 시그널링 서버 (TypeScript)
├─ nginx/                  # 리버스 프록시 설정
├─ docker-compose.yml      # 전체 스택 배포 설정
├─ env.example            # 환경 변수 예시
└─ README-Docker.md       # Docker 사용법 문서
```

### 5. 설치 및 실행 방법

#### 5.1. 설치 절차 및 실행

> 수정부탁드립니다

```bash
# 0) 필수: Docker & Docker Compose 설치

# 1) 환경 변수 설정
cp .env.example .env
# OPENAI_API_KEY, MONGO_URI, UNITY_STREAM_URL 등 설정

# 2) 빌드 & 실행
docker compose up --build

# 3) 접속
# - Dashboard (Frontend): http://localhost:5173

```

**권장 포트(예시)**

* Frontend: `5173`
* BFF(Express): `8080`
* RL Control(FastAPI): `18080`
* Unity Render Streaming: 프로젝트 설정에 따름(예: `7000~8000` 범위)

## 5.2. 오류 발생 시 해결 방법(자주 나오는 이슈) -  확인하시고 수정부탁드립니다

| 증상                | 원인/설명                 | 조치                                       |
| ----------------- | --------------------- | ---------------------------------------- |
| 포트 충돌(EADDRINUSE) | 로컬에 기존 프로세스 점유        | 해당 포트 사용하는 프로세스 종료 or `.env`로 포트 변경      |
| WebRTC 연결 불가      | 방화벽/회사망에서 UDP/TURN 차단 | 다른 네트워크(핫스팟)로 테스트, TURN 설정/포트 허용, 프록시 해제 |
| OpenAI API 오류     | 키 미설정/레이트 리밋          | `.env` 키 확인, 재시도 백오프, 요금제 확인             |
| Unity 스트리밍 끊김     | 브라우저 탭 비활성/CPU 과점유    | 탭 전면 유지, 프레임레이트/비트레이트 조정                 |
| 학습 로그 미표시         | 이벤트 파일 경로 불일치         | TensorBoard 로그 디렉토리 경로 재확인               |

---

### 6. 소개 자료 및 시연 영상

#### 6.1. 프로젝트 소개 자료

> 발표 슬라이드/문서 링크 추가

#### 6.2. 시연 영상

[![시연 영상](https://img.youtube.com/vi/zVyBsuvrQdw/0.jpg)](https://www.youtube.com/watch?v=zVyBsuvrQdw&t=2s)

**YouTube 링크**: [시연 영상 보기](https://www.youtube.com/watch?v=zVyBsuvrQdw&t=2s)

---

### 7. 팀 구성

#### 7.1. 팀원별 소개 및 역할 분담

| 프로필                                                           | 이름  | 역할                 | GitHub                                             |
| ------------------------------------------------------------- | --- | ------------------ | -------------------------------------------------- |
| <img src="https://github.com/skybluesharkk.png" width="60" /> | 심영찬 | 강화학습 알고리즘 개선 & 실험  | [@skybluesharkk](https://github.com/skybluesharkk) |
| <img src="https://github.com/zopa2161.png" width="60" />      | 김동건 | 시뮬레이션 환경 구축(UNITY) | [@zopa2161](https://github.com/zopa2161)             |
| <img src="https://github.com/Hyeonsik-0.png" width="60" />    | 오현식 | 웹 대시보드 & 시각화 개발    | [@Hyeonsik-0](https://github.com/Hyeonsik-0)             |

#### 7.2. 팀원 별 참여 후기

* **심영찬**:
* **김동건**:
* **오현식**:

---

### 8. 참고 문헌 및 출처

* [OpenAI API Docs]
* [Stable Baselines3] https://github.com/DLR-RM/stable-baselines3
* [Unity ML-Agents] https://github.com/Unity-Technologies/ml-agents
* [Gymnasium] https://gymnasium.farama.org/index.html

