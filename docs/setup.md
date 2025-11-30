# 설정 가이드

## 필수 요구사항

- Node.js 18+ 및 Yarn 1.22+
- Python 3.11+
- Supabase 프로젝트 계정

## 프로젝트 빌드 및 실행

### 1단계: 저장소 클론 및 의존성 설치

```bash
# 저장소 클론 (이미 클론한 경우 생략)
git clone <repository-url>
cd hotfixAI

# 루트 의존성 설치 (workspace 관리용)
yarn install

# Frontend 의존성 자동 설치 (workspace를 통해)
# Backend 의존성 설치
cd apps/backend
pip install -r requirements.txt
cd ../..
```

**참고**: Yarn workspace를 사용하므로 루트에서 `yarn install`을 실행하면 모든 workspace 패키지의 의존성이 자동으로 설치됩니다.

### 2단계: Supabase 프로젝트 생성 및 설정

#### 2.1 Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입 및 로그인
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - 프로젝트 이름: `hotfixai` (또는 원하는 이름)
   - 데이터베이스 비밀번호 설정 (안전하게 보관)
   - 리전 선택 (가장 가까운 리전)
4. 프로젝트 생성 완료 대기 (약 2분 소요)

#### 2.2 Supabase API 키 확인

1. Supabase Dashboard → **Settings** (왼쪽 하단 톱니바퀴 아이콘)
2. **API** 메뉴 클릭
3. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
     - 위치: "Project URL" 섹션
   - **anon/public key**: `eyJhbGc...` (JWT 토큰 형태)
     - 위치: "Project API keys" 섹션 → **anon/public** 키
     - 프론트엔드와 백엔드 모두에서 사용
   - **service_role key**: `eyJhbGc...` (⚠️ 절대 공개하지 말 것!)
     - 위치: "Project API keys" 섹션 → **service_role** 키
     - **"Reveal" 버튼 클릭**하여 전체 키 표시
     - 백엔드에서만 사용 (프론트엔드 코드에 포함 금지!)
   - **JWT Secret**: `your-super-secret-jwt-token-with-at-least-32-characters-long`
     - 위치: "JWT Settings" 섹션 → **JWT Secret**
     - 백엔드에서만 사용

**📋 상세 가이드**: [Supabase API 키 찾기 가이드](supabase-keys-guide.md) 참고

#### 2.3 OAuth 프로바이더 설정

**구글 OAuth 설정:**

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. 애플리케이션 유형: **Web application**
5. 승인된 리디렉션 URI 추가:
   ```
   https://<your-project-id>.supabase.co/auth/v1/callback
   ```
   (예: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`)
6. **Client ID**와 **Client Secret** 복사
7. Supabase Dashboard → **Authentication** → **Providers** → **Google**
8. Enable Google provider 체크
9. Client ID와 Client Secret 입력 후 **Save** 클릭

**네이버 OAuth 설정:**

1. [Naver Developers](https://developers.naver.com/) 접속 및 로그인
2. **Application** → **Application 등록**
3. 애플리케이션 정보 입력:
   - 애플리케이션 이름: `HotfixAI` (또는 원하는 이름)
   - 사용 API: **네이버 로그인**
   - 로그인 오픈 API 서비스 환경: **PC 웹**
   - 서비스 URL: `http://localhost:3000` (개발용)
   - Callback URL: `https://<your-project-id>.supabase.co/auth/v1/callback`
4. 등록 후 **Client ID**와 **Client Secret** 확인
5. Supabase Dashboard → **Authentication** → **Providers** → **Naver**
6. Enable Naver provider 체크
7. Client ID와 Client Secret 입력 후 **Save** 클릭

### 3단계: 환경 변수 설정

#### Frontend 환경 변수

`apps/frontend/.env.local` 파일 생성:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 애플리케이션 URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

**중요**: `NEXT_PUBLIC_` 접두사가 붙은 변수만 클라이언트에서 접근 가능합니다.

#### Backend 환경 변수

`apps/backend/.env` 파일 생성:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ⚠️ 서비스 롤 키 (절대 공개하지 말 것!)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long

# 애플리케이션 URL
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# CORS 설정 (JSON 배열 형태)
CORS_ORIGINS=["http://localhost:3000"]

# JWT 알고리즘
JWT_ALGORITHM=HS256
```

**중요 사항**:
- `SUPABASE_SERVICE_ROLE_KEY`는 백엔드에서만 사용하며, 절대 프론트엔드에 노출하면 안 됩니다.
- `CORS_ORIGINS`는 JSON 배열 형태로 작성해야 합니다.

### 4단계: 개발 서버 실행

#### 방법 1: 동시 실행 (권장)

```bash
# 루트 디렉토리에서
yarn dev
```

이 명령어는 Frontend와 Backend를 동시에 실행합니다:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

#### 방법 2: 개별 실행

**Frontend만 실행:**
```bash
# 루트에서
yarn dev:frontend

# 또는 frontend 디렉토리에서
cd apps/frontend
yarn dev
```

**Backend만 실행:**
```bash
# 루트에서
yarn dev:backend

# 또는 backend 디렉토리에서
cd apps/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5단계: 프로덕션 빌드

#### Frontend 빌드

```bash
# Frontend 디렉토리로 이동
cd apps/frontend

# 프로덕션 빌드
yarn build

# 프로덕션 서버 실행
yarn start
```

**프로덕션 환경 변수**:
- `.env.local` 대신 `.env.production` 또는 배포 플랫폼의 환경 변수 설정 사용
- `NEXT_PUBLIC_FRONTEND_URL`과 `NEXT_PUBLIC_BACKEND_URL`을 프로덕션 URL로 변경

#### Backend 빌드

```bash
# Backend 디렉토리로 이동
cd apps/backend

# 프로덕션 환경 변수 설정 (.env 파일)
# uvicorn으로 실행
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**프로덕션 환경 변수**:
- `.env` 파일에 프로덕션 Supabase URL 및 키 설정
- `FRONTEND_URL`과 `BACKEND_URL`을 프로덕션 URL로 변경
- `CORS_ORIGINS`에 프로덕션 프론트엔드 URL 추가

## Supabase 연동 확인

### 1. Frontend 연결 확인

브라우저에서 `http://localhost:3000` 접속 후:
- 콘솔에 Supabase 연결 오류가 없는지 확인
- `/auth/login` 페이지에서 로그인 버튼이 표시되는지 확인

### 2. OAuth 로그인 테스트

1. `http://localhost:3000/auth/login` 접속
2. 구글 또는 네이버 로그인 버튼 클릭
3. OAuth 인증 완료
4. 홈으로 리다이렉트되며 사용자 정보가 표시되는지 확인

### 3. Backend API 확인

브라우저 또는 터미널에서:

```bash
# 공개 엔드포인트 테스트
curl http://localhost:8000/

# 헬스 체크
curl http://localhost:8000/health

# 보호된 엔드포인트 테스트 (인증 필요)
curl http://localhost:8000/api/example/protected
# 예상: 401 Unauthorized
```

### 4. API 문서 확인

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 문제 해결

### Frontend 연결 오류

**증상**: Supabase 연결 실패 또는 "Missing Supabase environment variables" 오류

**해결책**:
1. `apps/frontend/.env.local` 파일이 올바른 위치에 있는지 확인
2. 환경 변수 이름이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. Supabase URL과 Anon Key가 올바른지 확인
4. 개발 서버 재시작 (`yarn dev`)

### Backend 인증 오류

**증상**: JWT 검증 실패 또는 설정 오류

**해결책**:
1. `apps/backend/.env` 파일이 올바른 위치에 있는지 확인
2. `SUPABASE_JWT_SECRET`이 Supabase Dashboard의 JWT Secret과 일치하는지 확인
3. `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
4. 환경 변수 로드 확인 (Python에서 `.env` 파일 자동 로드)

### OAuth 로그인 오류

**증상**: "redirect_uri_mismatch" 또는 로그인 실패

**해결책**:
1. **리다이렉트 URI 확인**:
   - Google: Google Cloud Console에서 리다이렉트 URI가 `https://<project-id>.supabase.co/auth/v1/callback`와 정확히 일치하는지 확인
   - Naver: Naver Developers에서 Callback URL이 동일한지 확인

2. **OAuth 프로바이더 설정 확인**:
   - Supabase Dashboard에서 Google/Naver provider가 Enable되어 있는지 확인
   - Client ID와 Client Secret이 올바른지 확인

3. **개발 환경 테스트**:
   - 로컬에서 먼저 테스트 후 프로덕션 배포

### CORS 오류

**증상**: Frontend에서 Backend API 호출 시 CORS 오류

**해결책**:
1. `apps/backend/.env`에서 `CORS_ORIGINS` 확인
2. JSON 배열 형태로 작성되어 있는지 확인: `["http://localhost:3000"]`
3. Backend 서버 재시작

### Python 의존성 오류

**증상**: `pydantic_settings` 또는 다른 패키지 import 오류

**해결책**:
```bash
cd apps/backend
pip install -r requirements.txt
# 또는
pip install --upgrade -r requirements.txt
```

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [FastAPI 공식 문서](https://fastapi.tiangolo.com/)
- [프로젝트 아키텍처 문서](./architecture.md)
- [인증 가이드](./auth.md)
- [API 가이드](./api.md)
