/**
 * 사용자 프로필 컴포넌트
 */
'use client'

import { useEffect, useState } from 'react'
import { authService } from '@/lib/auth/auth-service'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { user, error } = await authService.getCurrentUser()
      if (error) {
        console.error('Error fetching user:', error)
      } else {
        setUser(user)
      }
      setLoading(false)
    }

    fetchUser()

    // 세션 변경 감지
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    const { error } = await authService.signOut()
    if (!error) {
      router.push('/')
    }
  }

  if (loading) {
    return <div>로딩 중...</div>
  }

  if (!user) {
    return (
      <div>
        <a href="/auth/login" className="text-blue-500 hover:underline">
          로그인
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div>
        <p className="font-semibold">{user.email}</p>
        <p className="text-sm text-gray-500">{user.id}</p>
      </div>
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        로그아웃
      </button>
    </div>
  )
}

