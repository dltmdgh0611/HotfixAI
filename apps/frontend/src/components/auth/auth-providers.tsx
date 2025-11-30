/**
 * OAuth 프로바이더 버튼 그룹 컴포넌트
 * (재사용성)
 */
'use client'

import { LoginButton } from './login-button'

export function AuthProviders() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">로그인</h2>
      <LoginButton provider="google" />
      <LoginButton provider="naver" />
    </div>
  )
}

