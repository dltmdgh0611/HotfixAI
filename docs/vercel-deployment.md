# Vercel 배포 가이드

## 개요

이 프로젝트는 Frontend와 Backend를 별도로 배포할 수 있습니다.

- **Frontend**: Vercel (Next.js)
- **Backend**: Vercel Serverless Functions 또는 별도 서버 (Railway, AWS 등)

## 환경 변수 관리

Vercel에서는 프로젝트별로 환경 변수를 관리합니다. Frontend와 Backend가 같은 환경 변수를 사용하므로, 두 프로젝트 모두에 동일한 변수를 설정해야 합니다.

## Frontend 배포 (Vercel)

### 1. Vercel 프로젝트 생성

1. [Vercel](https://vercel.com)에 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 연결 또는 코드 업로드
4. 프로젝트 설정:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/frontend`
   - **Build Command**: `yarn build` (자동 감지)
   - **Output Directory**: `.next` (자동 감지)
   - **Install Command**: `yarn install` (루트에서 실행)

### 2. 환경 변수 설정

Vercel Dashboard → 프로젝트 설정 → **Environment Variables**에서 다음 변수 추가:

```env
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# 애플리케이션 URL
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend-url.vercel.app
```

**중요**: 
- `NEXT_PUBLIC_` 접두사가 붙은 변수만 클라이언트에서 접근 가능
- Production, Preview, Development 환경 모두에 추가

### 3. 빌드 설정

Vercel이 자동으로 감지하지만, 필요시 `vercel.json` 파일 생성:

```json
{
  "buildCommand": "cd apps/frontend && yarn build",
  "outputDirectory": "apps/frontend/.next",
  "installCommand": "yarn install",
  "framework": "nextjs"
}
```

### 4. 배포

- GitHub에 푸시하면 자동 배포
- 또는 Vercel CLI 사용:
```bash
cd apps/frontend
vercel
```

## Backend 배포

### 옵션 1: Vercel Serverless Functions (Next.js API Routes)

Frontend와 같은 프로젝트에 API Routes로 추가:

1. `apps/frontend/src/app/api/` 디렉토리에 FastAPI를 Express/Next.js API Routes로 변환
2. 또는 별도 Vercel 프로젝트로 배포 (권장하지 않음)

### 옵션 2: 별도 서버 배포 (권장)

FastAPI는 별도 서버에서 실행하는 것이 좋습니다.

**Railway 배포:**

1. [Railway](https://railway.app)에 로그인
2. "New Project" → "Deploy from GitHub repo"
3. Backend 디렉토리 선택: `apps/backend`
4. 환경 변수 설정:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_JWT_SECRET=your-jwt-secret
BACKEND_URL=https://your-backend.railway.app
FRONTEND_URL=https://your-frontend.vercel.app
CORS_ORIGINS=["https://your-frontend.vercel.app"]
JWT_ALGORITHM=HS256
```
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**AWS/Render 등 다른 플랫폼도 동일한 방식으로 배포 가능**

### 옵션 3: Docker 컨테이너 (Railway/Render 등)

`apps/backend/Dockerfile` 생성:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 환경 변수 통합 관리

### 로컬 개발 환경

루트 디렉토리의 `.env.example` 파일을 참고하여:

1. **Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

2. **Backend** (`apps/backend/.env`):
```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=["http://localhost:3000"]
JWT_ALGORITHM=HS256
```

### Vercel 배포 환경

Vercel Dashboard에서 설정한 환경 변수는 자동으로 주입됩니다.

**중요**: 
- `NEXT_PUBLIC_` 접두사가 붙은 변수는 클라이언트 빌드 시 번들에 포함됨
- 서버 전용 변수(`SUPABASE_SERVICE_ROLE_KEY` 등)는 Frontend 프로젝트에 **추가하지 마세요**

## 배포 후 확인 사항

### Frontend

1. ✅ 환경 변수가 올바르게 설정되었는지 확인
2. ✅ Supabase 연결 확인 (브라우저 콘솔)
3. ✅ OAuth 로그인 테스트

### Backend

1. ✅ 환경 변수가 올바르게 설정되었는지 확인
2. ✅ API 문서 접근: `https://your-backend-url/docs`
3. ✅ CORS 설정 확인 (Frontend에서 API 호출 가능한지)

## 문제 해결

### 환경 변수가 적용되지 않음

- Vercel Dashboard에서 변수 추가 후 재배포 필요
- `NEXT_PUBLIC_` 접두사 확인
- 환경(Production/Preview/Development)별로 설정 확인

### CORS 오류

Backend의 `CORS_ORIGINS`에 Frontend URL이 포함되어 있는지 확인:
```env
CORS_ORIGINS=["https://your-frontend.vercel.app"]
```

### Supabase 연결 오류

- Supabase Dashboard에서 프로젝트 상태 확인
- API 키가 올바른지 확인
- 네트워크 방화벽 확인

## 참고 자료

- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase 배포 가이드](https://supabase.com/docs/guides/hosting/overview)

