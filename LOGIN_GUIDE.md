# 로그인 & 프로필 기능 가이드

## 🎉 구현 완료!

### ✅ 완료된 기능

1. **구글 OAuth 로그인**
   - ✅ 구글 계정으로 로그인
   - ✅ 로그인 즉시 자동 회원가입
   - ✅ 사용자 정보 DB 저장

2. **프로필 기능**
   - ✅ 헤더에 프로필 버튼 표시
   - ✅ 사용자 이름 및 이메일 표시
   - ✅ 프로필 사진 표시 (구글 계정 이미지)

3. **계정 관리**
   - ✅ 로그아웃
   - ✅ 계정 삭제 (모든 프로젝트 및 데이터 삭제)

4. **인증 보호**
   - ✅ 401 오류 처리 (자동 로그인 페이지 리다이렉트)
   - ✅ 인증된 사용자만 프로젝트 접근 가능

---

## 🚀 사용 방법

### 1. 로그인

1. http://localhost:3000/auth/login 접속
2. "Google로 계속하기" 버튼 클릭
3. 구글 계정 선택 및 권한 승인
4. 자동으로 `/start` 페이지로 이동

### 2. 프로필 보기

로그인 후 헤더 우측 상단의 **프로필 버튼** 클릭:
- 사용자 이름
- 이메일 주소 확인

### 3. 로그아웃

프로필 메뉴 → **로그아웃** 클릭

### 4. 계정 삭제

프로필 메뉴 → **계정 삭제** 클릭
- ⚠️ **주의**: 모든 프로젝트와 파일이 영구적으로 삭제됩니다
- 되돌릴 수 없습니다

---

## 🔧 설정 방법

### Google OAuth 설정 (필수)

OAuth 설정은 **`OAUTH_SETUP.md`** 파일을 참고하세요.

간단 요약:

#### 1. Google Cloud Console
1. https://console.cloud.google.com
2. OAuth Client ID 생성
3. Authorized redirect URIs 추가:
   ```
   https://rtaaecwtiwbzjmtckwmj.supabase.co/auth/v1/callback
   ```

#### 2. Supabase Dashboard
1. https://supabase.com/dashboard/project/rtaaecwtiwbzjmtckwmj/auth/providers
2. Google Provider 활성화
3. Client ID/Secret 입력

---

## 🔄 작동 흐름

### 로그인 플로우

```
1. 사용자: "Google로 계속하기" 클릭
   ↓
2. Supabase: Google OAuth 페이지로 리다이렉트
   ↓
3. 사용자: 구글 계정 선택 & 권한 승인
   ↓
4. Supabase: /auth/callback으로 리다이렉트
   ↓
5. 백엔드: 
   - Supabase에서 사용자 정보 가져오기
   - DB에 자동 저장 (upsert)
   - 프로필 정보 업데이트
   ↓
6. 프론트: /start 페이지로 리다이렉트
```

### 인증 플로우

```
페이지 로드
   ↓
API 호출 (/api/projects)
   ↓
인증 확인 (쿠키에서 세션 토큰 확인)
   ↓
- 인증 성공 → 데이터 반환
- 인증 실패 (401) → /auth/login으로 리다이렉트
```

---

## 🛠️ API 엔드포인트

### 인증 관련

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/auth/me` | 현재 사용자 정보 |
| DELETE | `/api/auth/delete-account` | 계정 삭제 |
| GET | `/auth/callback` | OAuth 콜백 (자동 회원가입) |

### 프로젝트 관련

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/projects` | 프로젝트 목록 (인증 필요) |
| POST | `/api/projects` | 프로젝트 생성 (인증 필요) |
| GET | `/api/projects/[id]` | 프로젝트 상세 (인증 필요) |
| DELETE | `/api/projects/[id]` | 프로젝트 삭제 (인증 필요) |

---

## 🗂️ 데이터베이스

### users 테이블

로그인 시 자동으로 생성되는 정보:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,           -- Supabase Auth user ID
  email VARCHAR UNIQUE,          -- 이메일
  name VARCHAR,                  -- 이름 (구글 프로필)
  avatar VARCHAR,                -- 프로필 사진 URL
  provider VARCHAR,              -- 'google'
  created_at TIMESTAMP,          -- 가입 시간
  updated_at TIMESTAMP           -- 마지막 로그인
);
```

### 데이터 확인

```bash
yarn prisma:studio
```

→ `users` 테이블에서 로그인한 사용자 정보 확인

---

## 🐛 문제 해결

### 1. "401 Unauthorized" 오류

**증상**: 로그인했는데 프로젝트 목록이 안 보이고 401 오류

**원인**: 
- 세션 쿠키가 설정되지 않음
- Supabase 설정 오류

**해결**:
1. 브라우저 쿠키 확인 (개발자 도구 → Application → Cookies)
   - `sb-{project-ref}-auth-token` 쿠키가 있어야 함
2. `.env` 파일 확인:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://rtaaecwtiwbzjmtckwmj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
3. 개발 서버 재시작:
   ```bash
   yarn dev
   ```

### 2. 프로필 사진이 안 보임

**원인**: 구글 계정에 프로필 사진이 없음

**해결**: 기본 아이콘이 표시됩니다 (정상 동작)

### 3. 로그아웃 후에도 세션이 유지됨

**원인**: 브라우저 캐시

**해결**:
1. Hard refresh: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
2. 브라우저 캐시 삭제

### 4. 계정 삭제 후 다시 로그인하면?

**정상 동작**: 새로운 계정으로 자동 가입됩니다.
- 이전 데이터는 복구 불가능

---

## ✅ 체크리스트

로그인 기능이 제대로 작동하는지 확인:

- [ ] Google OAuth 설정 완료
- [ ] 로그인 성공
- [ ] `/start` 페이지로 리다이렉트
- [ ] 헤더에 프로필 버튼 표시
- [ ] 프로필 메뉴에서 이름/이메일 확인
- [ ] 로그아웃 작동
- [ ] 계정 삭제 작동
- [ ] 401 오류 시 로그인 페이지 리다이렉트
- [ ] DB에 사용자 정보 저장 확인

---

## 📝 네이버 로그인은?

현재 네이버 로그인은 **준비 중**입니다.

네이버는 Supabase에서 기본 지원하지 않으므로, **커스텀 구현**이 필요합니다.

일단 구글 로그인으로 진행하시는 것을 권장합니다.

---

**로그인 & 프로필 기능이 완성되었습니다!** 🎊

궁금한 점이 있으면 언제든 질문하세요.

