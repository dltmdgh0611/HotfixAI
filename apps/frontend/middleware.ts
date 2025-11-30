/**
 * Next.js 미들웨어
 * 세션 관리 및 인증 체크
 * NextAuth를 사용하므로 별도의 세션 업데이트는 필요 없습니다.
 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // NextAuth가 자동으로 세션을 관리하므로 여기서는 단순히 요청을 통과시킵니다.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
