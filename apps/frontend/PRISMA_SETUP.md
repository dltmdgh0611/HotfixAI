# Prisma 설정 가이드

## 문제 해결: "Cannot convert undefined or null to object" 오류

이 오류는 Prisma가 환경 변수를 찾지 못해서 발생합니다.

## 해결 방법

### 1. `.env.local` 파일 생성

`apps/frontend/.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Prisma Database URLs
DATABASE_URL=postgresql://postgres:[비밀번호]@[호스트]:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[비밀번호]@[호스트]:5432/postgres
```

### 2. 임시 더미 값 사용 (테스트용)

Supabase 설정이 아직 안 되어 있다면, 임시로 더미 값을 사용할 수 있습니다:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/db
DIRECT_URL=postgresql://user:password@localhost:5432/db
```

**주의**: 이 값으로는 실제 DB 연결은 안 되지만, Prisma Client 생성은 가능합니다.

### 3. Prisma Client 생성

```bash
cd apps/frontend
yarn prisma generate
```

### 4. 실제 Supabase 연결 정보 설정

Supabase 설정이 완료되면 `.env.local` 파일의 DATABASE_URL과 DIRECT_URL을 실제 값으로 교체하세요.

---

## Supabase 연결 정보 가져오기

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Database**
4. **Connection string** 섹션에서:
   - **Session mode** (포트 6543) → `DATABASE_URL`
   - **Direct connection** (포트 5432) → `DIRECT_URL`

---

## 빠른 시작

```bash
# 1. .env.local 파일 생성 (위 내용 복사)
cd apps/frontend
# .env.local 파일을 수동으로 생성하세요

# 2. Prisma Client 생성
yarn prisma generate

# 3. 개발 서버 실행
yarn dev
```

