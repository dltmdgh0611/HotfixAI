/**
 * 로그인 버튼 컴포넌트
 * (Single Responsibility: 로그인 UI만 담당)
 */
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { AuthProvider } from '@/types/auth'

interface LoginButtonProps {
  provider: AuthProvider
  children?: React.ReactNode
  className?: string
}

export function LoginButton({ provider, children, className = '' }: LoginButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      if (provider === 'naver') {
        setError('네이버 로그인은 준비 중입니다. 구글 로그인을 이용해주세요.')
        setLoading(false)
        return
      }
      
      await signIn(provider, { 
        callbackUrl: '/start',
        redirect: true 
      })
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
      setLoading(false)
    }
  }

  const getProviderName = (provider: AuthProvider): string => {
    switch (provider) {
      case 'google':
        return '구글'
      case 'naver':
        return '네이버'
      default:
        return provider
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleLogin}
        disabled={loading}
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? '로그인 중...' : children || `${getProviderName(provider)}로 로그인`}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}

