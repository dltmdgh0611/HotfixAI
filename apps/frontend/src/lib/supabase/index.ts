/**
 * Supabase 클라이언트 모듈 통합 export
 * (Interface Segregation: 필요한 것만 export)
 * 
 * ⚠️ 주의: 클라이언트 컴포넌트에서만 사용하세요!
 * - 클라이언트 컴포넌트: './client' 직접 import 사용
 * - 서버 컴포넌트/API Routes: './server' 직접 import 사용
 * - 미들웨어: './middleware' 직접 import 사용
 * 
 * 이 파일은 클라이언트 전용 export만 포함합니다.
 */

// 클라이언트 전용 export만 제공
export { supabase } from './client'

// 서버 전용 모듈은 클라이언트에서 import하면 안 됩니다!
// 직접 import 사용:
// - 서버 컴포넌트: import { createClient } from '@/lib/supabase/server'
// - 미들웨어: import { updateSession } from '@/lib/supabase/middleware'

