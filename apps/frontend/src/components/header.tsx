'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { FiTool, FiUser, FiLogOut, FiTrash2 } from 'react-icons/fi'

export function Header() {
  const router = useRouter()
  const { data: session } = useSession()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  async function handleLogout() {
    await signOut({ callbackUrl: '/auth/login' })
  }

  async function handleDeleteAccount() {
    if (!confirm('정말로 계정을 삭제하시겠습니까? 모든 프로젝트와 데이터가 삭제됩니다.')) {
      return
    }

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'DELETE'
      })

      if (res.ok) {
        await signOut({ callbackUrl: '/auth/login' })
        alert('계정이 삭제되었습니다.')
        router.push('/auth/login')
      } else {
        const data = await res.json()
        alert(data.error || '계정 삭제에 실패했습니다.')
      }
    } catch (error) {
      alert('계정 삭제 중 오류가 발생했습니다.')
    }
  }

  return (
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
        <div style={{ width: 28, height: 28, background: '#3b82f6', borderRadius: 6 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>HotfixAI</span>
      </div>
      
      <nav style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>가격</a>
        <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>가이드</a>
        <a href="#" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>업데이트</a>
        
        {session?.user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f3f4f6',
                border: 'none',
                padding: '8px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500
              }}
            >
              {session.user.image ? (
                <Image 
                  src={session.user.image} 
                  alt="Profile"
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                  unoptimized
                />
              ) : (
                <FiUser size={20} />
              )}
              <span>{session.user.name || session.user.email}</span>
            </button>

            {showProfileMenu && (
              <>
                <div 
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 99
                  }}
                  onClick={() => setShowProfileMenu(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  minWidth: 200,
                  zIndex: 100
                }}>
                  <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
                      {session.user.name || '사용자'}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {session.user.email}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      color: '#374151'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiLogOut size={16} />
                    로그아웃
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false)
                      setShowDeleteModal(true)
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      borderTop: '1px solid #e5e7eb',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 14,
                      color: '#dc2626'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiTrash2 size={16} />
                    계정 삭제
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push('/auth/login')}
            style={{
              background: '#e6f0ff',
              color: '#1e3a8a',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            로그인
          </button>
        )}
      </nav>

      {/* 계정 삭제 확인 모달 */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200
        }}
        onClick={() => setShowDeleteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: 400,
              width: '90%'
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#111827' }}>
              계정을 삭제하시겠습니까?
            </h3>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
              계정을 삭제하면 모든 프로젝트, 파일, 데이터가 영구적으로 삭제됩니다. 
              이 작업은 되돌릴 수 없습니다.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#374151'
                }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                계정 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

