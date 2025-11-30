/**
 * 개별 프로젝트 관리 API
 * GET: 프로젝트 상세 조회 (파일 포함)
 * PATCH: 프로젝트 업데이트
 * DELETE: 프로젝트 삭제
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: 프로젝트 상세 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const project = await prisma.project.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id
      },
      include: {
        files: {
          orderBy: { name: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ project })
  } catch (error: any) {
    console.error('[API][Project][GET]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: 프로젝트 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description } = body

    const project = await prisma.project.updateMany({
      where: { 
        id: params.id,
        userId: session.user.id
      },
      data: {
        name,
        description,
      }
    })

    if (project.count === 0) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API][Project][PATCH]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: 프로젝트 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const result = await prisma.project.deleteMany({
      where: { 
        id: params.id,
        userId: session.user.id
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[API][Project][DELETE]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


