# OAuth 로그인 설정 가이드

## 🎯 개요

HotfixAI는 **구글 OAuth**를 통한 소셜 로그인을 지원합니다.
(네이버는 Supabase에서 기본 지원하지 않아 구글 로그인을 권장합니다)

---

## 🔧 구글 OAuth 설정

### 1단계: Google Cloud Console 설정

#### 1. Google Cloud Console 접속
https://console.cloud.google.com

#### 2. 새 프로젝트 생성 (또는 기존 프로젝트 선택)
- **프로젝트 이름**: HotfixAI (또는 원하는 이름)

#### 3. OAuth 동의 화면 구성
1. **APIs & Services** → **OAuth consent screen** 메뉴로 이동
2. **User Type**: External 선택 → **Create**
3. **앱 정보 입력**:
   - 앱 이름: `HotfixAI`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처 정보: 본인 이메일
4. **저장 및 계속**

#### 4. OAuth 2.0 Client ID 생성
1. **APIs & Services** → **Credentials** 메뉴로 이동
2. **+ CREATE CREDENTIALS** → **OAuth client ID** 클릭
3. **Application type**: Web application
4. **Name**: HotfixAI Web Client
5. **Authorized redirect URIs** 추가:
   ```
   https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   
   **예시**:
   ```
   https://rtaaecwtiwbzjmtckwmj.supabase.co/auth/v1/callback
   ```
   
   **중요**: `[YOUR-SUPABASE-PROJECT-REF]`를 실제 Supabase 프로젝트 ref로 변경하세요!
   - Supabase Dashboard URL에서 확인 가능: 
     `https://supabase.com/dashboard/project/rtaaecwtiwbzjmtckwmj`
     → `rtaaecwtiwbzjmtckwmj` 부분이 프로젝트 ref

6. **Create** 클릭
7. **Client ID**와 **Client Secret** 복사 (나중에 사용)

---

### 2단계: Supabase 설정

#### 1. Supabase Dashboard 접속
https://supabase.com/dashboard/project/rtaaecwtiwbzjmtckwmj/auth/providers

#### 2. Google Provider 활성화
1. **Authentication** → **Providers** 메뉴로 이동
2. **Google** 찾기
3. **Enable** 토글 켜기
4. Google Cloud Console에서 복사한 값 입력:
   - **Client ID**: 복사한 Client ID
   - **Client Secret**: 복사한 Client Secret
5. **Save** 클릭

---

### 3단계: 로컬 테스트

#### 1. 개발 서버 실행
```bash
cd apps/frontend
yarn dev
```

#### 2. 브라우저에서 접속
```
http://localhost:3000/auth/login
```

#### 3. 구글 로그인 테스트
1. **"Google로 계속하기"** 버튼 클릭
2. 구글 계정 선택
3. 권한 승인
4. 자동으로 `/start` 페이지로 리다이렉트

---

## 🔄 작동 흐름

```
1. 사용자가 "Google로 계속하기" 클릭
   ↓
2. Supabase Google OAuth 페이지로 리다이렉트
   ↓
3. 사용자가 구글 계정 선택 및 권한 승인
   ↓
4. Supabase /auth/callback 으로 리다이렉트
   ↓
5. 백엔드에서 사용자 정보 자동 저장 (자동 회원가입)
   ↓
6. /start 페이지로 리다이렉트
```

---

## 📝 환경 변수 확인

`.env` 파일에 Supabase 정보가 제대로 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://rtaaecwtiwbzjmtckwmj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛠️ 문제 해결

### 1. "OAuth Error: redirect_uri_mismatch" 오류
**원인**: Google Cloud Console의 Authorized redirect URIs가 잘못됨

**해결**:
1. Google Cloud Console → OAuth Client 설정으로 이동
2. Authorized redirect URIs에 정확히 추가:
   ```
   https://rtaaecwtiwbzjmtckwmj.supabase.co/auth/v1/callback
   ```
3. 끝에 `/` 없이, 정확히 일치해야 합니다

### 2. "Provider not enabled" 오류
**원인**: Supabase에서 Google Provider가 활성화되지 않음

**해결**:
1. Supabase Dashboard → Authentication → Providers
2. Google Provider **Enable** 토글 켜기
3. Client ID/Secret 입력 후 저장

### 3. 로그인 후 아무 반응 없음
**원인**: Callback 라우트 또는 자동 회원가입 로직 오류

**해결**:
1. 브라우저 콘솔에서 오류 메시지 확인
2. Supabase Dashboard → Authentication → Users에서 사용자 생성되었는지 확인
3. 데이터베이스 `users` 테이블에 데이터 저장되었는지 확인

---

## ✅ 체크리스트

OAuth 설정이 완료되면 아래 항목을 체크하세요:

- [ ] Google Cloud Console에서 OAuth Client ID 생성
- [ ] Authorized redirect URI 추가 완료
- [ ] Supabase에서 Google Provider 활성화
- [ ] Client ID/Secret 입력 완료
- [ ] 로컬에서 구글 로그인 테스트 성공
- [ ] 로그인 후 `/start` 페이지 리다이렉트 확인
- [ ] 데이터베이스 `users` 테이블에 사용자 정보 저장 확인

---

## 🚀 배포 시 추가 설정

Vercel 등에 배포할 때는 **프로덕션 URL**도 추가해야 합니다:

### Google Cloud Console
Authorized redirect URIs에 추가:
```
https://your-production-domain.com/auth/callback
```

### Supabase
Redirect URL 설정:
1. Authentication → URL Configuration
2. **Site URL** 및 **Redirect URLs**에 프로덕션 도메인 추가

---

**로그인 설정이 완료되었습니다!** 🎉

궁금한 점이 있으면 언제든 질문하세요.

