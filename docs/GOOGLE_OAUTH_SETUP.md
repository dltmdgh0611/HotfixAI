# Google OAuth 설정 가이드

## 1. Supabase에서 Google OAuth 설정

### 1.1 Google Cloud Console에서 OAuth 클라이언트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. **APIs & Services > Credentials** 이동
4. **+ CREATE CREDENTIALS > OAuth client ID** 클릭
5. Application type: **Web application** 선택
6. Name: 프로젝트 이름 입력 (예: HotfixAI)
7. **Authorized redirect URIs** 추가:
   ```
   https://<your-project-ref>.supabase.co/auth/v1/callback
   ```
   예: `https://abcdefghijk.supabase.co/auth/v1/callback`

8. **CREATE** 클릭
9. **Client ID**와 **Client Secret** 복사 (다음 단계에서 사용)

### 1.2 Supabase Dashboard에서 Google Provider 활성화

1. [Supabase Dashboard](https://app.supabase.com/) 로그인
2. 프로젝트 선택
3. **Authentication > Providers** 이동
4. **Google** 찾아서 **Enable** 토글
5. Google Cloud Console에서 복사한 정보 입력:
   - **Client ID**: 복사한 Client ID 붙여넣기
   - **Client Secret**: 복사한 Client Secret 붙여넣기
6. **Save** 클릭

## 2. Next.js 프론트엔드에서 Google 로그인 구현

### 2.1 로그인 버튼 컴포넌트 예제

\`\`\`typescript
// src/components/LoginButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: \`\${window.location.origin}/auth/callback\`,
      },
    })
    
    if (error) {
      console.error('Error logging in:', error.message)
    }
  }

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Google로 로그인
    </button>
  )
}
\`\`\`

### 2.2 인증 콜백 라우트 생성

\`\`\`typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 로그인 후 리다이렉트할 페이지
  return NextResponse.redirect(\`\${requestUrl.origin}/dashboard\`)
}
\`\`\`

### 2.3 로그아웃 기능

\`\`\`typescript
// src/components/LogoutButton.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleLogout}>
      로그아웃
    </button>
  )
}
\`\`\`

## 3. 환경 변수 확인

\`.env.local\` 파일에 다음 변수들이 설정되어 있는지 확인:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

## 4. 테스트

1. 개발 서버 실행: \`npm run dev\`
2. Google 로그인 버튼 클릭
3. Google 계정 선택 및 권한 승인
4. 로그인 후 대시보드로 리다이렉트 확인

## 참고 자료

- [Supabase Auth with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
