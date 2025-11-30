# 아키텍처 문서

## 프로젝트 구조

```
hotfixAI/
├── apps/
│   ├── frontend/         # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router
│   │   │   ├── components/  # React 컴포넌트
│   │   │   ├── lib/      # 라이브러리 및 유틸리티
│   │   │   └── types/    # TypeScript 타입 정의
│   │   └── package.json
│   └── backend/          # FastAPI 백엔드
│       ├── app/
│       │   ├── core/     # 핵심 설정 및 공통 모듈
│       │   ├── routers/  # API 라우터
│       │   ├── middleware/  # 미들웨어
│       │   └── services/    # 비즈니스 로직 서비스
│       ├── main.py       # FastAPI 진입점
│       └── requirements.txt
├── docs/                 # 프로젝트 문서
├── package.json          # 루트 package.json (workspace 관리)
└── .gitignore
```

## 기술 스택

### Frontend
- **Next.js 14+**: React 프레임워크 (App Router)
- **TypeScript**: 타입 안정성
- **Supabase Client**: 데이터베이스 및 인증 클라이언트

### Backend
- **FastAPI**: Python 웹 프레임워크
- **Supabase**: 백엔드 서비스 (인증, 데이터베이스)
- **Python 3.11+**: Python 버전

### Infrastructure
- **Yarn Workspace**: 모노레포 관리
- **Supabase**: 인증 및 데이터베이스 서비스

## 아키텍처 원칙

### 1. 모노레포 구조
- Yarn workspace를 통한 프로젝트 관리
- 공유 타입 및 유틸리티 패키지 확장 가능

### 2. 레이어 분리
- **Presentation Layer** (Frontend): UI 및 사용자 인터랙션
- **API Layer** (Backend): 비즈니스 로직 및 데이터 처리
- **Data Layer** (Supabase): 데이터 저장 및 관리

### 3. SOLID 원칙 준수
- **Single Responsibility**: 각 모듈은 하나의 책임만
- **Open/Closed**: 확장에는 열려있고 수정에는 닫혀있음
- **Liskov Substitution**: 하위 타입은 상위 타입을 대체 가능
- **Interface Segregation**: 클라이언트별로 인터페이스 분리
- **Dependency Inversion**: 추상화에 의존

### 4. 재사용성
- 공통 컴포넌트 및 유틸리티 클래스 분리
- 서비스 레이어 패턴 적용
- 싱글톤 패턴으로 인스턴스 재사용

## 데이터 흐름

1. **인증 흐름**
   - Frontend → Supabase Auth (OAuth)
   - Supabase Auth → JWT 토큰 발급
   - Frontend → Backend (JWT 토큰 포함)
   - Backend → JWT 검증 → 요청 처리

2. **API 요청 흐름**
   - Frontend → Backend API
   - Backend → JWT 검증 (미들웨어)
   - Backend → Supabase (데이터 조회/수정)
   - Backend → Frontend (응답 반환)

## 보안 고려사항

1. **JWT 토큰 검증**: 모든 보호된 엔드포인트에서 JWT 검증
2. **CORS 설정**: 허용된 origin만 접근 가능
3. **환경 변수**: 민감한 정보는 환경 변수로 관리
4. **HTTPS**: 프로덕션 환경에서 HTTPS 사용 필수

## 확장 가능성

- 새로운 OAuth 프로바이더 추가 용이 (Open/Closed 원칙)
- 새로운 API 라우터 추가 용이
- 공유 패키지 추가 가능 (packages 디렉토리)
- 마이크로서비스로 분리 가능한 구조

