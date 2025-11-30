'use client'

import { useState, useEffect } from 'react'
import { FiTool } from 'react-icons/fi'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 로그인되어 있으면 /start로 리다이렉트
    if (status === 'authenticated') {
      console.log('[Login] Already authenticated, redirecting to /start')
      router.push('/start')
    }
  }, [status, router])

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('[Login] Starting Google OAuth login with NextAuth...')
      await signIn('google', { 
        callbackUrl: '/start',
        redirect: true 
      })
    } catch (err: any) {
      console.error('[Login] Google login error:', err)
      setError(err?.message || '로그인 중 오류가 발생했습니다.')
      setIsLoading(false)
    }
  }

  const handleNaverLogin = async () => {
    setError('네이버 로그인은 준비 중입니다. 구글 로그인을 이용해주세요.')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 50%, #93c5fd 100%)'
    }}>
      {/* Left Side - Branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '80px',
        color: 'white'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'white',
          borderRadius: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <FiTool color="#3b82f6" size={48} aria-label="wrench icon" />
        </div>
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          marginBottom: '16px',
          color: '#1e3a8a'
        }}>
          HotfixAI
        </h1>
        <p style={{
          fontSize: '20px',
          color: '#1e40af',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          AI와 함께 실시간으로 코드를 수정하세요
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div style={{
        width: '500px',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 60px'
      }}>
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <FiTool color="#3b82f6" size={32} aria-label="wrench icon" />
          </div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '8px'
          }}>
            다시 오신 것을 환영합니다
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            HotfixAI에 로그인하세요
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#b91c1c',
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              color: '#111827',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#f9fafb')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = 'white')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {isLoading ? '로그인 중...' : 'Google로 계속하기'}
          </button>

          {/* Naver Login */}
          <button
            onClick={handleNaverLogin}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#03C75A',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              color: 'white',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              opacity: isLoading ? 0.6 : 1
            }}
            onMouseOver={(e) => !isLoading && (e.currentTarget.style.background = '#02b350')}
            onMouseOut={(e) => !isLoading && (e.currentTarget.style.background = '#03C75A')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
            </svg>
            {isLoading ? '로그인 중...' : '네이버로 계속하기'}
          </button>
        </div>

        <p style={{
          marginTop: '32px',
          fontSize: '13px',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          계속 진행하면 아래 정책을 이해하고 동의하는 것으로 간주됩니다.
        </p>

        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          fontSize: '13px'
        }}>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            이용약관
          </a>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'underline' }}>
            개인정보처리방침
          </a>
        </div>
      </div>
    </div>
  )
}
