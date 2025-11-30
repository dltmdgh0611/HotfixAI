/**
 * 현재 사용자 정보 API
 * GET: 로그인한 사용자 정보 반환
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    return NextResponse.json({ user: session.user })
  } catch (error: any) {
    console.error('[API][Me]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
