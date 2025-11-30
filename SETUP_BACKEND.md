# HotfixAI 백엔드 설정 가이드

## 1. 데이터베이스 설정

### Prisma 마이그레이션 실행

프로젝트 폴더에서 다음 명령어를 실행하세요:

```bash
cd apps/frontend
npx prisma generate
npx prisma db push
```

이 명령어들은:
- Prisma Client를 생성합니다
- 데이터베이스에 테이블을 생성합니다 (User, Project, File)

## 2. 환경 변수 설정

`apps/frontend/.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase 설정 (OAuth 인증용)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 데이터베이스 연결 (Supabase Postgres)
DATABASE_URL=postgresql://postgres:[password]@[host]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[password]@[host]:5432/postgres

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key
```

### Supabase 설정 방법

1. [Supabase](https://supabase.com)에 로그인
2. 새 프로젝트 생성
3. Settings > API에서 URL과 anon key 복사
4. Settings > Database에서 Connection string 복사
   - Session mode (pooler): `DATABASE_URL`로 사용
   - Direct connection: `DIRECT_URL`로 사용

### Supabase OAuth 설정

#### 구글 OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials로 이동
4. OAuth 2.0 Client ID 생성
5. 승인된 리디렉션 URI에 추가:
   - `https://[your-project-ref].supabase.co/auth/v1/callback`
6. Client ID와 Client Secret을 Supabase에 등록:
   - Supabase Dashboard > Authentication > Providers > Google
   - Enable Google provider
   - Client ID와 Client Secret 입력

#### 네이버 OAuth 설정
1. [네이버 개발자 센터](https://developers.naver.com/apps/) 접속
2. 애플리케이션 등록
3. 서비스 환경: PC 웹 선택
4. 서비스 URL과 Callback URL 설정:
   - Callback URL: `https://[your-project-ref].supabase.co/auth/v1/callback`
5. Client ID와 Client Secret을 Supabase에 등록:
   - Supabase Dashboard > Authentication > Providers
   - 현재 Naver는 기본 지원되지 않으므로, Generic OAuth Provider로 설정
   - 또는 커스텀 로직 구현 필요

참고: 네이버 OAuth는 Supabase에서 기본 지원하지 않습니다. 구글 OAuth로 먼저 테스트하시는 것을 권장합니다.

## 3. 데이터베이스 스키마

다음 테이블들이 자동으로 생성됩니다:

### users
- 사용자 정보 저장
- OAuth 로그인 시 자동 생성

### projects
- 사용자의 프로젝트 목록
- FTP 연결 정보 포함

### files
- 프로젝트별 파일 내용
- AI 수정 시 자동 업데이트

## 4. API 엔드포인트

### 인증
- `GET /auth/callback` - OAuth 콜백 (자동 회원가입)

### 프로젝트
- `GET /api/projects` - 프로젝트 목록
- `POST /api/projects` - 프로젝트 생성
- `GET /api/projects/[id]` - 프로젝트 상세
- `PATCH /api/projects/[id]` - 프로젝트 수정
- `DELETE /api/projects/[id]` - 프로젝트 삭제

### 파일
- `POST /api/files/update` - 파일 업데이트 (AI 수정 시)

## 5. 개발 서버 실행

```bash
cd apps/frontend
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 6. 작동 방식

1. **로그인**: 구글/네이버 OAuth로 로그인 → 자동 회원가입
2. **프로젝트 생성**: FTP/파일/폴더로 프로젝트 생성 → DB에 저장
3. **AI 수정**: 파일 수정 시 자동으로 DB 업데이트
4. **재방문**: start 페이지에서 저장된 프로젝트 목록 확인

## 문제 해결

### Prisma 오류
```bash
npx prisma generate
npx prisma db push --force-reset
```

### 데이터베이스 연결 오류
- Supabase 프로젝트가 활성화되어 있는지 확인
- DATABASE_URL과 DIRECT_URL이 올바른지 확인
- 방화벽/네트워크 설정 확인

### OAuth 오류
- Supabase Dashboard에서 Provider가 활성화되어 있는지 확인
- Redirect URL이 정확한지 확인
- Client ID/Secret이 올바른지 확인


