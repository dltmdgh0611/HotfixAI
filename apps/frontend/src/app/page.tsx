'use client'

import { useRouter } from 'next/navigation'
import { FiTool } from 'react-icons/fi'

export default function Home() {
  const router = useRouter()

  return (
    <div style={{ minHeight: '100vh', background: '#fafbfc' }}>
      {/* Header - Floating */}
      <header style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 80px)',
        maxWidth: '1200px',
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiTool color="#3b82f6" size={28} aria-label="wrench icon" />
          <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            HotfixAI
          </span>
        </div>
        <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            가격
          </a>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            가이드
          </a>
          <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
            업데이트
          </a>
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              background: '#e6f0ff',
              color: '#1e3a8a',
              border: 'none',
              padding: '9px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#d7e7ff'}
            onMouseOut={(e) => e.currentTarget.style.background = '#e6f0ff'}
          >
            시작하기
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '160px 40px 120px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '64px',
          fontWeight: '800',
          color: '#111827',
          marginBottom: '24px',
          lineHeight: '1.1'
        }}>
          카페24 홈페이지 수정,<br/>이제 AI에게 맡기세요
        </h1>
        
        <p style={{
          fontSize: '20px',
          color: '#6b7280',
          marginBottom: '40px',
          maxWidth: '700px',
          margin: '0 auto 40px'
        }}>
          HTML, CSS 파일을 업로드하고 자연어로 설명하면<br/>
          AI가 자동으로 코드를 수정해드립니다
        </p>

        <button
          onClick={() => router.push('/auth/login')}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '16px 48px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
        >
          무료로 시작하기
        </button>

        <div style={{
          marginTop: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          <div style={{ display: 'flex', marginRight: '8px' }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: `hsl(${i * 60}, 70%, 60%)`,
                marginLeft: i > 1 ? '-8px' : '0',
                border: '2px solid white'
              }} />
            ))}
          </div>
          10,000명 이상의 개발자가 사용 중
        </div>
      </section>

      {/* Screenshot Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto 120px',
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        gap: '80px'
      }}>
        <div style={{
          flex: 1,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖼️</div>
            <div>스크린샷 미리보기</div>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '16px'
            }}>
              카페24 쇼핑몰 디자인 수정이 어려우셨나요?
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              lineHeight: '1.6',
              marginBottom: '24px'
            }}>
              "상단 배너 색상을 파란색으로 바꿔줘"<br/>
              "모바일에서 버튼 크기를 키워줘"<br/><br/>
              이렇게 말하면 AI가 자동으로 코드를 수정합니다.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              style={{
                background: 'white',
                color: '#3b82f6',
                border: '2px solid #3b82f6',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#3b82f6'
                e.currentTarget.style.color = 'white'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white'
                e.currentTarget.style.color = '#3b82f6'
              }}
            >
              무료로 시작하기
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'white',
        borderTop: '1px solid #e5e7eb',
        padding: '40px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <p>© 2024 HotfixAI. All rights reserved.</p>
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>이용약관</a>
          <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>개인정보처리방침</a>
        </div>
      </footer>
    </div>
  )
}
