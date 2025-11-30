# 코딩 규칙 및 표준

## 객체지향 설계 원칙 (SOLID)

### 1. Single Responsibility Principle (단일 책임 원칙)

**규칙**: 각 클래스/모듈은 하나의 책임만 가져야 합니다.

**좋은 예:**
```python
# 사용자 관련 비즈니스 로직만 담당
class UserService:
    def get_user_by_id(self, user_id: str):
        pass
    
    def update_user(self, user_id: str, data: dict):
        pass
```

**나쁜 예:**
```python
# 사용자 관리 + 이메일 전송 + 로깅을 모두 담당 (책임이 너무 많음)
class UserService:
    def get_user_by_id(self, user_id: str):
        pass
    
    def send_email(self, to: str, message: str):
        pass
    
    def log_error(self, error: str):
        pass
```

### 2. Open/Closed Principle (개방-폐쇄 원칙)

**규칙**: 확장에는 열려있고 수정에는 닫혀있어야 합니다.

**좋은 예:**
```typescript
// 새로운 프로바이더 추가 시 AuthService는 수정하지 않고 확장 가능
export type AuthProvider = 'google' | 'naver' | 'github' // 새 프로바이더 추가만 하면 됨

export class AuthService {
  async signInWithOAuth(provider: AuthProvider) {
    // provider가 무엇이든 동일한 방식으로 처리
  }
}
```

**나쁜 예:**
```typescript
// 새 프로바이더 추가 시마다 메서드 추가 필요
export class AuthService {
  async signInWithGoogle() {}
  async signInWithNaver() {}
  async signInWithGithub() {} // 새 메서드 추가 필요
}
```

### 3. Liskov Substitution Principle (리스코프 치환 원칙)

**규칙**: 하위 타입은 언제나 상위 타입을 대체할 수 있어야 합니다.

**좋은 예:**
```python
# 인터페이스 정의
class DatabaseClient:
    def execute_query(self, query: str):
        raise NotImplementedError

# Supabase 구현
class SupabaseClient(DatabaseClient):
    def execute_query(self, query: str):
        # Supabase 특정 구현
        pass

# PostgreSQL 구현 (동일한 인터페이스 준수)
class PostgreSQLClient(DatabaseClient):
    def execute_query(self, query: str):
        # PostgreSQL 특정 구현
        pass
```

### 4. Interface Segregation Principle (인터페이스 분리 원칙)

**규칙**: 클라이언트는 자신이 사용하지 않는 메서드에 의존하지 않아야 합니다.

**좋은 예:**
```typescript
// 필요한 것만 export
export { supabase } from './client'  // 클라이언트만 필요한 경우
export { createClient } from './server'  // 서버만 필요한 경우
```

**나쁜 예:**
```typescript
// 모든 것을 export (불필요한 의존성)
export * from './client'
export * from './server'
export * from './middleware'
export * from './admin'  // 대부분의 클라이언트가 사용하지 않음
```

### 5. Dependency Inversion Principle (의존성 역전 원칙)

**규칙**: 추상화에 의존해야 하며 구체화에 의존하지 않아야 합니다.

**좋은 예:**
```python
# 추상화에 의존
def get_user_service() -> UserService:
    return UserService()

# FastAPI Depends 사용 (추상화)
@router.get("/users")
async def get_users(
    user_service: UserService = Depends(get_user_service)
):
    pass
```

**나쁜 예:**
```python
# 구체적인 구현에 직접 의존
@router.get("/users")
async def get_users():
    supabase = create_client(...)  # 구체적인 구현에 의존
    # 직접 사용
    pass
```

## 재사용성 원칙

### 1. 공통 로직 분리

**유틸리티 함수/클래스 생성:**
```typescript
// utils/validation.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// 여러 컴포넌트에서 재사용
```

### 2. 컴포넌트 재사용

**재사용 가능한 컴포넌트 설계:**
```tsx
// Button 컴포넌트 - 다양한 용도로 재사용 가능
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant = 'primary', size = 'md', ...props }: ButtonProps) {
  // 재사용 가능한 버튼 컴포넌트
}
```

### 3. 서비스 레이어 패턴

**비즈니스 로직을 서비스로 분리:**
```python
# 재사용 가능한 서비스 클래스
class ItemService:
    def __init__(self):
        self.supabase = get_supabase()
    
    def get_items(self, user_id: str):
        # 여러 라우터에서 재사용 가능
        pass
```

### 4. 싱글톤 패턴

**인스턴스 재사용:**
```python
@lru_cache()
def get_settings() -> Settings:
    """설정 싱글톤 반환"""
    return Settings()

# 여러 곳에서 동일한 인스턴스 사용
```

## 코딩 스타일

### Python

1. **PEP 8 준수**
   - 4칸 들여쓰기
   - 최대 줄 길이 79자 (가능하면 88자까지 허용)

2. **타입 힌팅**
   ```python
   def get_user_by_id(user_id: str) -> Optional[dict]:
       pass
   ```

3. **Docstring**
   ```python
   def get_user_by_id(user_id: str) -> Optional[dict]:
       """
       사용자 ID로 사용자 정보 조회
       @param user_id 사용자 ID
       @return 사용자 정보 또는 None
       """
       pass
   ```

### TypeScript

1. **명확한 타입 정의**
   ```typescript
   interface User {
     id: string
     email: string
     name?: string
   }
   ```

2. **함수 시그니처 명확히**
   ```typescript
   async function getUser(id: string): Promise<User | null> {
     // ...
   }
   ```

3. **JSDoc 주석**
   ```typescript
   /**
    * 사용자 정보 조회
    * @param id 사용자 ID
    * @returns 사용자 정보 또는 null
    */
   async function getUser(id: string): Promise<User | null> {
     // ...
   }
   ```

## 파일 및 디렉토리 명명

### 파일명
- **Python**: snake_case (`user_service.py`)
- **TypeScript**: kebab-case 또는 camelCase (`user-service.ts` 또는 `userService.ts`)

### 클래스명
- **Python**: PascalCase (`UserService`)
- **TypeScript**: PascalCase (`UserService`)

### 함수/변수명
- **Python**: snake_case (`get_user_by_id`)
- **TypeScript**: camelCase (`getUserById`)

## 주석 및 문서화

### 코드 주석
- **WHY**를 설명 (WHAT은 코드 자체로 설명)
- 복잡한 로직에만 주석 추가
- 자명한 코드에는 주석 금지

### 문서화
- 모든 public 함수/클래스에 docstring/JSDoc 추가
- 모듈 레벨 문서화
- API 엔드포인트 문서화

## 에러 처리

### 예외 처리
```python
try:
    result = some_operation()
except SpecificException as e:
    logger.error(f"Operation failed: {e}")
    raise HTTPException(status_code=400, detail=str(e))
```

### 에러 로깅
- 모든 에러는 로깅
- 민감한 정보는 로그에 포함하지 않음
- 프로덕션 환경에서는 일반적인 에러 메시지만 반환

## 테스트

### 테스트 작성 원칙
- 단위 테스트: 각 함수/클래스별로 테스트
- 통합 테스트: API 엔드포인트별로 테스트
- 테스트 커버리지 최대화 목표

### 테스트 명명
```python
def test_get_user_by_id_returns_user_when_exists():
    pass

def test_get_user_by_id_returns_none_when_not_exists():
    pass
```

## 코드 리뷰 체크리스트

- [ ] SOLID 원칙 준수
- [ ] 재사용성 고려
- [ ] 타입 안정성 확보
- [ ] 에러 처리 적절
- [ ] 문서화 완료
- [ ] 테스트 작성
- [ ] 보안 고려사항 체크

