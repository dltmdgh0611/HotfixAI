# 빠른 시작 가이드

이 문서는 프로젝트를 빠르게 시작하기 위한 단계별 가이드입니다.

## 전제 조건 체크리스트

- [ ] Node.js 18+ 설치 확인: `node --version`
- [ ] Yarn 설치 확인: `yarn --version`
- [ ] Python 3.11+ 설치 확인: `python --version` 또는 `python3 --version`
- [ ] Supabase 계정 생성 완료

## 5분 빠른 시작

### 1. 의존성 설치 (1분)

```bash
# 루트 디렉토리에서
yarn install

# Backend Python 의존성 설치
cd apps/backend
pip install -r requirements.txt
cd ../..
```

### 2. Supabase 설정 (2분)

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 새 프로젝트 생성 (또는 기존 프로젝트 사용)
3. Settings → API에서 다음 정보 복사:
   - Project URL
   - anon/public key
   - service_role key
   - JWT Secret

### 3. 환경 변수 설정 (1분)

#### Frontend (`apps/frontend/.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL_붙여넣기
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_붙여넣기
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

#### Backend (`apps/backend/.env`)
```env
NEXT_PUBLIC_SUPABASE_URL=여기에_Project_URL_붙여넣기
SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_key_붙여넣기
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_key_붙여넣기
SUPABASE_JWT_SECRET=여기에_JWT_Secret_붙여넣기
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000"]
JWT_ALGORITHM=HS256
```

### 4. 서버 실행 (1분)

```bash
# 루트 디렉토리에서
yarn dev
```

### 5. 확인

1. 브라우저에서 `http://localhost:3000` 접속
2. Backend API 문서: `http://localhost:8000/docs`
3. 로그인 테스트: `http://localhost:3000/auth/login`

## OAuth 로그인 설정 (추가 10분)

OAuth 로그인을 사용하려면:

### 구글 OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 → APIs & Services → Credentials
3. OAuth client ID 생성
4. 리디렉션 URI 추가: `https://<your-project-id>.supabase.co/auth/v1/callback`
5. Supabase Dashboard → Authentication → Providers → Google
6. Client ID와 Secret 입력

### 네이버 OAuth 설정

1. [Naver Developers](https://developers.naver.com/) 접속
2. 애플리케이션 등록
3. Callback URL: `https://<your-project-id>.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Naver
5. Client ID와 Secret 입력

## 다음 단계

- [아키텍처 문서](./architecture.md) 읽기
- [인증 가이드](./auth.md)로 상세한 인증 구현 방법 배우기
- [API 가이드](./api.md)로 새로운 API 엔드포인트 추가하기
- [코딩 규칙](./coding-standards.md)으로 코드 작성 원칙 이해하기

## 도움이 필요하신가요?

- 문제 해결: [설정 가이드의 문제 해결 섹션](./setup.md#문제-해결) 참고
- Supabase 문서: https://supabase.com/docs
- Next.js 문서: https://nextjs.org/docs
- FastAPI 문서: https://fastapi.tiangolo.com/









