/**
 * 프로젝트 관리 API
 * GET: 사용자 프로젝트 목록 조회
 * POST: 새 프로젝트 생성
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 프로젝트 목록 조회
export async function GET(req: NextRequest) {
  try {
    console.log('[API][Projects][GET] Request received')
    
    const session = await getServerSession(authOptions)

    console.log('[API][Projects][GET] Session:', session?.user?.email || 'No session')

    if (!session?.user?.id) {
      console.error('[API][Projects][GET] No authenticated user, returning 401')
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { files: true }
        }
      }
    })

    return NextResponse.json({ projects })
  } catch (error: any) {
    console.error('[API][Projects][GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: 프로젝트 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, sourceType, ftpHost, ftpPort, ftpPath, files } = body

    // 프로젝트 생성
    const project = await prisma.project.create({
      data: {
        name,
        description,
        sourceType,
        ftpHost,
        ftpPort,
        ftpPath,
        userId: session.user.id,
      }
    })

    // 파일 저장
    if (files && Array.isArray(files)) {
      await prisma.file.createMany({
        data: files.map((file: any) => ({
          name: file.name,
          content: file.content,
          projectId: project.id,
        }))
      })
    }

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('[API][Projects][POST]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


