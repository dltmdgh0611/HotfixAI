/**
 * 사용자 프로필 컴포넌트
 */
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function UserProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return <div>로딩 중...</div>
  }

  if (!session?.user) {
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
        <p className="font-semibold">{session.user.email}</p>
        <p className="text-sm text-gray-500">{session.user.id}</p>
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

