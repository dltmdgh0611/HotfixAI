import { signOut } from 'next-auth/react'

/**
 * API 클라이언트 - 인증된 요청 처리
 * 401 응답 시 자동으로 로그아웃 처리
 */
export async function apiClient<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    // 401 에러 시 자동 로그아웃
    if (response.status === 401) {
      console.warn('🔒 세션이 만료되었습니다. 로그아웃 처리 중...')
      await signOut({ callbackUrl: '/', redirect: true })
      return {
        error: '세션이 만료되었습니다. 다시 로그인해주세요.',
        status: 401,
      }
    }

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.error || '요청 처리에 실패했습니다.',
        status: response.status,
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    console.error('API 요청 오류:', error)
    return {
      error: '네트워크 오류가 발생했습니다.',
      status: 500,
    }
  }
}




