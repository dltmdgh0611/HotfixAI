import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const userId = session.user.id

    // 1. 사용자의 모든 프로젝트와 파일 삭제
    await prisma.project.deleteMany({
      where: { userId }
    })

    // 2. Account 테이블에서 OAuth 연결 삭제
    await prisma.account.deleteMany({
      where: { userId }
    })

    // 3. Session 테이블에서 세션 삭제
    await prisma.session.deleteMany({
      where: { userId }
    })

    // 4. 사용자 삭제
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API][Auth][DeleteAccount]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




