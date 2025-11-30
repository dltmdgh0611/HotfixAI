# 인증 규칙 및 가이드

## 인증 아키텍처

### 전체 흐름

1. **OAuth 로그인 시작**
   - 사용자가 구글/네이버 로그인 버튼 클릭
   - Frontend에서 `authService.signInWithOAuth()` 호출
   - Supabase Auth로 OAuth 프로바이더로 리다이렉트

2. **OAuth 콜백 처리**
   - OAuth 프로바이더 인증 완료 후 Supabase로 리다이렉트
   - Supabase에서 JWT 토큰 발급
   - Frontend `/auth/callback` 라우트에서 토큰 교환
   - 세션 생성 및 사용자 정보 저장

3. **API 요청 인증**
   - Frontend에서 API 요청 시 JWT 토큰을 Header에 포함
   - Backend 미들웨어에서 JWT 토큰 검증
   - 검증 성공 시 요청 처리, 실패 시 401 에러

## Frontend 인증 구현

### AuthService 사용

```typescript
import { authService } from '@/lib/auth/auth-service'

// OAuth 로그인
await authService.signInWithOAuth('google')
await authService.signInWithOAuth('naver')

// 로그아웃
await authService.signOut()

// 현재 사용자 정보 가져오기
const { user, error } = await authService.getCurrentUser()

// 세션 변경 이벤트 구독
authService.onAuthStateChange((event, session) => {
  // 세션 변경 처리
})
```

### 로그인 컴포넌트 사용

```tsx
import { LoginButton } from '@/components/auth/login-button'

<LoginButton provider="google" />
<LoginButton provider="naver" />
```

### 사용자 프로필 컴포넌트

```tsx
import { UserProfile } from '@/components/auth/user-profile'

<UserProfile />
```

### Protected Route 구현

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth/auth-service'

export default function ProtectedPage() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { user, error } = await authService.getCurrentUser()
      if (error || !user) {
        router.push('/auth/login')
      } else {
        setUser(user)
      }
    }
    checkAuth()
  }, [router])

  if (!user) return <div>로딩 중...</div>

  return <div>보호된 컨텐츠</div>
}
```

## Backend 인증 구현

### 미들웨어 사용

```python
from fastapi import Depends
from app.middleware.auth import get_current_user, get_current_user_id

# 전체 사용자 정보 가져오기
@router.get("/protected")
async def protected_endpoint(
    current_user: dict = Depends(get_current_user)
):
    return {"user": current_user}

# 사용자 ID만 가져오기
@router.get("/protected")
async def protected_endpoint(
    user_id: str = Depends(get_current_user_id)
):
    return {"user_id": user_id}
```

### JWT 토큰 검증 과정

1. **토큰 추출**: HTTP Authorization Header에서 Bearer 토큰 추출
2. **토큰 검증**: JWT Secret으로 토큰 서명 검증
3. **페이로드 추출**: 검증 성공 시 페이로드에서 사용자 정보 추출
4. **에러 처리**: 검증 실패 시 401 Unauthorized 반환

## OAuth 프로바이더 추가

### Frontend에 새로운 프로바이더 추가

1. **타입 정의 수정** (`src/types/auth.ts`):

```typescript
export type AuthProvider = 'google' | 'naver' | 'github' // 새 프로바이더 추가
```

2. **AuthService는 자동으로 지원** (Open/Closed 원칙):
- `signInWithOAuth()`는 모든 프로바이더를 지원
- Supabase에서 해당 프로바이더가 활성화되어 있으면 사용 가능

3. **UI 컴포넌트 추가**:

```tsx
<LoginButton provider="github" />
```

### Backend는 추가 설정 불필요

- JWT 토큰은 프로바이더와 무관하게 동일하게 검증
- 모든 OAuth 프로바이더에서 발급된 JWT는 동일한 방식으로 처리

## 보안 규칙

### Frontend

1. **환경 변수 보호**
   - 민감한 정보는 절대 클라이언트 코드에 노출하지 않음
   - Service Role Key는 Frontend에서 사용하지 않음

2. **토큰 저장**
   - Supabase 클라이언트가 자동으로 세션 관리
   - httpOnly 쿠키 사용 (서버 컴포넌트)

3. **HTTPS 사용**
   - 프로덕션 환경에서는 반드시 HTTPS 사용

### Backend

1. **JWT 검증 필수**
   - 모든 보호된 엔드포인트에서 JWT 검증
   - 토큰 만료 시간 체크

2. **CORS 설정**
   - 허용된 origin만 접근 가능하도록 설정
   - 프로덕션 환경에서는 특정 도메인만 허용

3. **에러 메시지**
   - 인증 실패 시 구체적인 에러 정보 노출 금지
   - 일반적인 에러 메시지만 반환

## 세션 관리

### 세션 새로고침

- Supabase 클라이언트가 자동으로 토큰 새로고침
- 미들웨어에서 세션 상태 확인 및 업데이트

### 세션 만료 처리

```typescript
authService.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // 세션 만료 또는 새로고침 처리
  }
})
```

## 테스트

### 로그인 테스트

1. 로그인 페이지 접근
2. 구글/네이버 로그인 버튼 클릭
3. OAuth 인증 완료
4. 콜백 처리 후 홈으로 리다이렉트
5. 사용자 프로필 표시 확인

### API 인증 테스트

```bash
# 토큰 없이 요청 (실패 예상)
curl http://localhost:8000/api/example/protected

# 토큰과 함께 요청 (성공)
curl -H "Authorization: Bearer <your-jwt-token>" \
  http://localhost:8000/api/example/protected
```

