# 프론트엔드 로그 설정 가이드

## 개요
프론트엔드 웹소켓(WebSocket) 및 SSE(Server-Sent Events) 관련 로그를 간소화하고 프로덕션 환경에서 로그가 출력되지 않도록 설정하는 방법을 설명합니다.

## 로그 레벨 설정

### 환경 변수
`.env` 파일에서 `VITE_LOG_LEVEL` 환경 변수를 설정하여 로그 레벨을 제어할 수 있습니다.

```bash
# 로그 레벨 설정 (debug, info, warn, error, none)
VITE_LOG_LEVEL=info
```

### 로그 레벨 설명
- `debug`: 모든 로그 출력 (개발 환경용)
- `info`: 정보 로그 이상 출력 (기본값)
- `warn`: 경고 로그 이상 출력
- `error`: 에러 로그만 출력 (프로덕션 권장)
- `none`: 모든 로그 비활성화

## 프로덕션 빌드

### 1. 환경별 빌드 스크립트
```bash
# 개발 빌드 (모든 로그 출력)
npm run build

# 프로덕션 빌드 (에러 로그만 출력)
npm run build:prod
```

### 2. 수동 환경 변수 설정
```bash
# 프로덕션 빌드 시 에러 로그만 출력
VITE_LOG_LEVEL=error npm run build

# 모든 로그 비활성화
VITE_LOG_LEVEL=none npm run build
```

## 로그 시스템 구조

### 1. 기본 Logger (`frontend/src/core/webrtc/logger.ts`)
- 환경 변수 기반 로그 레벨 제어
- 프로덕션에서는 error 로그만 출력
- 개발 환경에서는 설정된 레벨에 따라 출력

### 2. WebSocketLogger
- 웹소켓 전용 간소화된 로거
- 연결, 메시지, 이벤트, 에러 로그 분류
- 각 카테고리별로 다른 로그 레벨 적용

### 3. SSELogger
- SSE(Server-Sent Events) 전용 간소화된 로거
- 연결, 데이터, 이벤트, 에러 로그 분류
- 웹소켓과 구분된 로그 출력 형식

### 4. Vite 빌드 최적화
- 프로덕션 빌드 시 console.log, console.info, console.debug, console.warn 제거
- console.error는 유지 (에러 추적용)
- Terser를 통한 추가 최적화

## 사용 예시

### 개발 환경
```bash
# .env 파일
VITE_LOG_LEVEL=debug

# 개발 서버 실행
npm run dev
```

### 프로덕션 환경

#### 1. 로컬 프로덕션 빌드
```bash
# .env 파일
VITE_LOG_LEVEL=error

# 프로덕션 빌드
npm run build:prod
```

#### 2. Docker를 통한 프로덕션 빌드
```bash
# 전체 서비스 빌드 및 실행
docker-compose up -d

# nginx만 재시작 (프론트엔드 변경 시)
docker-compose up -d nginx
```

## 로그 출력 예시

### 개발 환경 (VITE_LOG_LEVEL=debug)
```
# 웹소켓 로그
🔌 WS: 연결 시도: ws://localhost/ws
✅ WS: 연결 성공
📨 WS: 메시지 수신: {"type":"connect","connectionId":"123"}
⚡ WS: connect 이벤트

# SSE 로그
🔗 SSE: 연결 시도: runId=123, status=running
🔗 SSE: 연결 성공
📊 SSE: 데이터 수신: {"timesteps":100,"chartMetrics":[...]}
⚡ SSE: 메트릭 데이터 처리 중
```

### 프로덕션 환경 (VITE_LOG_LEVEL=error)
```
# 웹소켓 에러만 출력
❌ WS: 연결 끊어짐: code=1006, reason=, wasClean=false

# SSE 에러만 출력
❌ SSE: 연결 오류: [object Event]
❌ SSE: 데이터 파싱 오류: SyntaxError
```

## 주의사항

1. **프로덕션 빌드**: `npm run build:prod` 사용 권장
2. **환경 변수**: `.env` 파일이 Git에 커밋되지 않도록 주의
3. **로그 레벨**: 프로덕션에서는 `error` 또는 `none` 사용 권장
4. **성능**: 과도한 로그는 성능에 영향을 줄 수 있음

## 문제 해결

### 로그가 출력되지 않는 경우
1. 환경 변수 `VITE_LOG_LEVEL` 확인
2. 프로덕션 빌드인지 확인 (`import.meta.env.PROD`)
3. 로그 레벨이 설정된 레벨 이상인지 확인

### 프로덕션에서 로그가 여전히 출력되는 경우
1. `npm run build:prod` 사용 확인
2. Vite 설정의 `define` 옵션 확인
3. Terser 설정의 `drop_console` 옵션 확인
