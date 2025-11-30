# NextAuth.js 설정 가이드

이 프로젝트는 **NextAuth.js**를 사용하여 Google OAuth 인증을 구현합니다.

## 1. 필요한 패키지 설치

```bash
cd apps/frontend
npm install
```

## 2. 환경 변수 설정

`apps/frontend/.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### NEXTAUTH_SECRET 생성

다음 명령어로 랜덤 시크릿 생성:

```bash
openssl rand -base64 32
```

또는 온라인에서 생성: https://generate-secret.vercel.app/32

### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "OAuth 동의 화면" 설정
4. "사용자 인증 정보" > "OAuth 2.0 클라이언트 ID" 생성
5. 승인된 리디렉션 URI 추가:
   - 개발: `http://localhost:3000/api/auth/callback/google`
   - 프로덕션: `https://yourdomain.com/api/auth/callback/google`
6. 클라이언트 ID와 클라이언트 보안 비밀을 복사하여 `.env.local`에 추가

## 3. Prisma 마이그레이션

NextAuth는 `User`, `Account`, `Session`, `VerificationToken` 테이블을 사용합니다.
이미 Prisma 스키마에 정의되어 있으므로 마이그레이션만 실행하면 됩니다:

```bash
npx prisma db push
# 또는
npx prisma migrate dev
```

## 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속 후 Google 로그인 테스트

## 5. 프로덕션 배포 시

프로덕션 환경에서는 다음을 설정하세요:

1. `NEXTAUTH_URL`을 프로덕션 도메인으로 변경
2. `NEXTAUTH_SECRET`을 새로 생성 (개발 환경과 다른 값 사용)
3. Google Cloud Console에서 프로덕션 리디렉션 URI 추가

## 주요 파일 구조

```
apps/frontend/
├── src/
│   ├── lib/
│   │   └── auth.ts                    # NextAuth 설정
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts       # NextAuth API 라우트
│   │   ├── auth/
│   │   │   └── login/
│   │   │       └── page.tsx           # 로그인 페이지
│   │   └── layout.tsx                 # SessionProvider 포함
│   ├── components/
│   │   └── providers.tsx              # SessionProvider 컴포넌트
│   └── types/
│       └── next-auth.d.ts             # NextAuth 타입 정의
└── .env.local                         # 환경 변수 (생성 필요)
```

## 사용 예시

### 클라이언트 컴포넌트에서

```tsx
'use client'
import { useSession, signIn, signOut } from 'next-auth/react'

export default function Component() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  
  if (!session) {
    return <button onClick={() => signIn('google')}>Sign in</button>
  }

  return (
    <div>
      <p>Signed in as {session.user.email}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  )
}
```

### 서버 컴포넌트/API 라우트에서

```tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  // 인증된 사용자 작업
  return Response.json({ user: session.user })
}
```

## 문제 해결

### 로그인 후 리디렉션이 안 됨
- `NEXTAUTH_URL`이 올바른지 확인
- Google Cloud Console의 리디렉션 URI가 정확한지 확인

### `Invalid refresh token` 오류
- Google Cloud Console에서 OAuth 앱을 "테스트" 모드에서 "프로덕션" 모드로 변경
- `access_type: "offline"` 및 `prompt: "consent"`가 설정되어 있는지 확인

### 세션이 유지되지 않음
- 쿠키가 제대로 설정되는지 확인 (HTTPS 환경에서는 `secure: true` 필요)
- `NEXTAUTH_SECRET`이 설정되어 있는지 확인


