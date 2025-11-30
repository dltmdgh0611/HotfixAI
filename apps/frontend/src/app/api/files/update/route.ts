/**
 * 파일 업데이트 API
 * POST: AI가 파일을 수정할 때 DB에 업데이트
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await req.json()
    const { projectId, fileName, content } = body

    if (!projectId || !fileName || content === undefined) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 파일 업데이트 또는 생성
    const file = await prisma.file.upsert({
      where: {
        projectId_name: {
          projectId,
          name: fileName
        }
      },
      update: {
        content,
        updatedAt: new Date()
      },
      create: {
        name: fileName,
        content,
        projectId
      }
    })

    // 프로젝트 updatedAt도 갱신
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ success: true, file })
  } catch (error: any) {
    console.error('[API][Files][Update]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


