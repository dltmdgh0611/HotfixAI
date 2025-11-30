import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

/**
 * 사용자 서비스
 * Supabase Auth와 Prisma를 활용한 사용자 관련 비즈니스 로직
 */
export class UserService {
    /**
     * Supabase Auth에서 사용자 ID로 사용자 정보 조회
     */
    static async getUserById(userId: string) {
        try {
            const supabase = await createClient()
            const { data, error } = await supabase.auth.admin.getUserById(userId)

            if (error || !data.user) {
                return null
            }

            return {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                createdAt: data.user.created_at,
            }
        } catch (error) {
            console.error('Error fetching user:', error)
            return null
        }
    }

    /**
     * 사용자 이메일 조회
     */
    static async getUserEmail(userId: string): Promise<string | null> {
        const user = await this.getUserById(userId)
        return user?.email ?? null
    }

    /**
     * Prisma를 사용한 커스텀 사용자 프로필 예제
     * (실제 테이블이 있는 경우에만 사용)
     */
    // static async getUserProfile(userId: string) {
    //   try {
    //     const profile = await prisma.userProfile.findUnique({
    //       where: { userId },
    //     })
    //     return profile
    //   } catch (error) {
    //     console.error('Error fetching user profile:', error)
    //     return null
    //   }
    // }
}

export default UserService
