# HotfixAI

Next.js + Supabase + Prisma 기반 풀스택 웹서비스

## 프로젝트 구조

```
hotfixAI/
├── apps/
│   └── frontend/         # Next.js 풀스택 애플리케이션
│       ├── src/
│       │   ├── app/      # Next.js App Router
│       │   │   └── api/  # API Routes (통합된 백엔드)
│       │   ├── components/
│       │   └── lib/      # Utilities, Prisma, Supabase
│       └── prisma/       # Prisma 스키마
├── docs/                 # 프로젝트 문서
└── package.json          # 루트 package.json (workspace 관리)
```

## 기술 스택

- **Frontend**: Next.js 14+, TypeScript, React
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Auth**: Supabase Auth (Google OAuth)
- **Infrastructure**: Yarn Workspace (모노레포)

## 빠른 시작

### 1. 의존성 설치

```bash
# 루트에서 모든 의존성 설치
yarn install

# 또는
cd apps/frontend
npm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://app.supabase.com)에서 새 프로젝트 생성
2. **Settings → Database**에서 Connection String 복사:
   - Transaction Pooler (포트 6543): `DATABASE_URL`용
   - Direct Connection (포트 5432): `DIRECT_URL`용
3. **Settings → API**에서 다음 정보 복사:
   - Project URL
   - anon/public key
   - service_role key (필요시)

### 3. 환경 변수 설정

`apps/frontend/.env.local` 파일 생성:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Prisma Database URLs
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

`.env.example` 파일에 자세한 설명이 있습니다.

### 4. Prisma 설정

```bash
cd apps/frontend

# Prisma 클라이언트 생성
npm run prisma:generate

# 데이터베이스 스키마 확인 (Prisma Studio)
npm run prisma:studio
```

### 5. Google OAuth 설정 (선택사항)

구글 로그인을 사용하려면 `docs/GOOGLE_OAUTH_SETUP.md`를 참고하세요.

### 6. 개발 서버 실행

```bash
# 프론트엔드 + API Routes 실행
cd apps/frontend
npm run dev

# 또는 루트에서
yarn dev:frontend

# 접속: http://localhost:3000
```

### 7. API Routes 테스트

```bash
# 공개 엔드포인트
curl http://localhost:3000/api/example/public

# 보호된 엔드포인트 (로그인 필요)
curl http://localhost:3000/api/example/protected

# 사용자 정보 (로그인 필요)
curl http://localhost:3000/api/auth/me
```

## 주요 API Routes

| 엔드포인트 | 메서드 | 인증 필요 | 설명 |
|-----------|--------|----------|------|
| `/api/auth/me` | GET | ✅ | 현재 사용자 정보 |
| `/api/auth/verify` | POST | ✅ | 토큰 검증 |
| `/api/example/public` | GET | ❌ | 공개 엔드포인트 |
| `/api/example/protected` | GET | ✅ | 보호된 엔드포인트 |

## 주요 기능

- ✅ Google OAuth 인증 (Supabase Auth)
- ✅ Next.js API Routes로 통합된 백엔드
- ✅ Prisma ORM으로 타입 안전한 DB 쿼리
- ✅ 서버 컴포넌트 및 서버 액션 지원
- ✅ 모노레포 구조
- ✅ TypeScript 전체 적용

## 문서

자세한 내용은 `docs/` 폴더를 참고하세요:

- **[빠른 시작 가이드](docs/quick-start.md)** ⚡ - 5분 안에 시작하기
- **[설정 가이드](docs/setup.md)** 📋 - 상세한 설정 및 빌드 가이드
- **[Google OAuth 설정](docs/GOOGLE_OAUTH_SETUP.md)** 🔐 - 구글 로그인 활성화 방법
- **[Supabase API 키 찾기](docs/supabase-keys-guide.md)** 🔑 - Supabase Dashboard에서 키 찾는 방법
- **[Vercel 배포 가이드](docs/vercel-deployment.md)** 🚀 - Vercel 배포 및 환경 변수 관리
- **[아키텍처 문서](docs/architecture.md)** 🏗️ - 프로젝트 구조 및 설계

## 빌드 및 배포

```bash
cd apps/frontend

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

Vercel 배포 시 환경 변수를 Vercel Dashboard에서 설정하세요.

## Prisma 사용법

```typescript
// 예제: API Route에서 Prisma 사용
import prisma from '@/lib/prisma'

// 데이터 조회
const users = await prisma.user.findMany()

// 데이터 생성
const newUser = await prisma.user.create({
  data: { email: 'user@example.com' }
})
```

Prisma Studio로 데이터베이스 관리:
```bash
npm run prisma:studio
```

## 라이선스

MIT

