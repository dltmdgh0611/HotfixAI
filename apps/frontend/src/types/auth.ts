/**
 * 인증 관련 타입 정의
 * (Single Responsibility: 타입 정의만 담당)
 */

export type AuthProvider = 'google' | 'naver'

export interface AuthUser {
  id: string
  email?: string
  name?: string
  avatar_url?: string
}

export interface AuthSession {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: AuthUser
}

