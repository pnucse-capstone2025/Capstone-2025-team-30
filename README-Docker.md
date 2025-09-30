# RL Dashboard - Docker Compose 통합 환경

이 프로젝트는 모든 서비스를 Docker Compose로 통합하여 단일 명령으로 실행할 수 있습니다.

## 🏗️ 아키텍처

```
┌─────────────────┐
│   Nginx (80/443) │ ← 외부 진입점
└─────────┬───────┘
          │
    ┌─────┴─────┐
    │  Frontend │ ← React + Nginx
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │ API Server│ ← Node.js BFF
    └─────┬─────┘
          │
    ┌─────┴─────┐
    │MongoDB    │ ← 데이터베이스
    └───────────┘

┌─────────────────┐
│  Signaling      │ ← WebSocket 서버
└─────────────────┘

┌─────────────────┐
│  FastAPI        │ ← Unity ML-Agents
└─────────────────┘
```

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 환경 변수 파일 생성
cp env.example .env

# .env 파일 편집 (필수)
# OPENAI_API_KEY=your_actual_api_key_here
```

### 2. 서비스 시작

**Windows (PowerShell):**
```powershell
.\start.ps1
```

**Linux/macOS:**
```bash
./start.sh
```

**수동 실행:**
```bash
docker-compose up --build -d
```

### 3. 서비스 확인

- **Frontend**: http://localhost
- **API Server**: http://localhost/api
- **FastAPI**: http://localhost/fastapi
- **Signaling**: http://localhost/signaling

## 📋 서비스 목록

| 서비스 | 포트 | 설명 |
|--------|------|------|
| nginx | 80/443 | 리버스 프록시 (외부 노출) |
| frontend | 80 (내부) | React 앱 + Nginx |
| api-server | 8080 (내부) | Node.js BFF |
| mlagents-gym | 8000 (내부) | FastAPI + Unity |
| signaling-server | 80 (내부) | WebSocket 서버 |
| mongodb | 27017 (내부) | 데이터베이스 |

## 🔧 관리 명령어

### 서비스 상태 확인
```bash
docker-compose ps
```

### 로그 확인
```bash
# 모든 서비스 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f frontend
docker-compose logs -f api-server
```

### 서비스 재시작
```bash
# 특정 서비스 재시작
docker-compose restart frontend

# 모든 서비스 재시작
docker-compose restart
```

### 서비스 중지
```bash
# 서비스 중지 (볼륨 유지)
docker-compose down

# 서비스 중지 + 볼륨 삭제
docker-compose down -v
```

### 완전 정리
```bash
# 모든 컨테이너, 볼륨, 네트워크 삭제
docker-compose down -v
docker system prune -f
```

## 🐛 문제 해결

### 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :80
netstat -ano | findstr :443

# 프로세스 종료
taskkill /PID <PID> /F
```

### 컨테이너 재빌드
```bash
# 특정 서비스만 재빌드
docker-compose build frontend
docker-compose up -d frontend

# 모든 서비스 재빌드
docker-compose build
docker-compose up -d
```

### 데이터베이스 초기화
```bash
# MongoDB 데이터 삭제
docker-compose down
docker volume rm new-capstone-test_mongodb_data
docker-compose up -d
```

## 📁 프로젝트 구조

```
├── docker-compose.yml          # 메인 Docker Compose 설정
├── nginx/
│   └── nginx.conf              # 메인 Nginx 설정
├── frontend/
│   ├── Dockerfile              # Frontend Docker 이미지
│   └── nginx.conf              # Frontend Nginx 설정
├── backend-final/
│   ├── api/                    # Node.js BFF
│   ├── fast_unity/             # FastAPI + Unity
│   └── signaling-server/       # WebSocket 서버
├── start.ps1                   # Windows 실행 스크립트
├── start.sh                    # Linux/macOS 실행 스크립트
└── env.example                 # 환경 변수 예시
```

## 🔒 보안 고려사항

1. **환경 변수**: `.env` 파일에 민감한 정보 저장
2. **네트워크**: 내부 서비스는 Docker 네트워크로 격리
3. **포트**: 외부에는 80/443 포트만 노출
4. **헤더**: Nginx에서 보안 헤더 설정

## 📊 모니터링

### 헬스체크
```bash
# 서비스 상태 확인
curl http://localhost/health

# 개별 서비스 확인
curl http://localhost/api/health
curl http://localhost/fastapi/health
```

### 리소스 사용량
```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너
docker stats frontend api-server mlagents-gym
```

## 🚀 배포

### 프로덕션 환경
1. `.env` 파일에 실제 값 설정
2. SSL 인증서 설정 (선택사항)
3. 도메인 설정
4. 방화벽 설정

### 스케일링
```bash
# 특정 서비스 인스턴스 증가
docker-compose up -d --scale api-server=3
```

## 📝 로그

로그는 다음 위치에 저장됩니다:
- **Nginx**: `/var/log/nginx/`
- **Application**: Docker 로그 (`docker-compose logs`)

## 🤝 기여

1. 이슈 생성
2. 브랜치 생성
3. 변경사항 커밋
4. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.
