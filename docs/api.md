# API 규칙 및 가이드

## FastAPI 라우터 작성 규칙

### 디렉토리 구조

```
apps/backend/app/routers/
├── __init__.py
├── auth.py          # 인증 관련 라우터
├── example.py       # 예제 라우터
└── [module].py      # 새로운 모듈 라우터
```

### 기본 라우터 템플릿

```python
"""
[모듈명] 라우터
(Single Responsibility: [모듈명] 관련 엔드포인트만 담당)
"""
from fastapi import APIRouter, Depends
from typing import List, Optional
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/api/[module]", tags=["[module]"])

@router.get("/")
async def list_items(
    user_id: str = Depends(get_current_user_id)
):
    """항목 목록 조회"""
    return {"items": []}

@router.post("/")
async def create_item(
    user_id: str = Depends(get_current_user_id)
):
    """항목 생성"""
    return {"message": "created"}
```

### 라우터 등록

`apps/backend/main.py`에 라우터 등록:

```python
from app.routers import auth, example, new_module

app.include_router(auth.router)
app.include_router(example.router)
app.include_router(new_module.router)
```

## 엔드포인트 작성 규칙

### 1. 명명 규칙

- **RESTful API** 규칙 준수
- `GET`: 조회
- `POST`: 생성
- `PUT`: 전체 수정
- `PATCH`: 부분 수정
- `DELETE`: 삭제

### 2. 엔드포인트 경로

```python
# 좋은 예
@router.get("/users/{user_id}")           # 특정 사용자 조회
@router.get("/users")                     # 사용자 목록 조회
@router.post("/users")                    # 사용자 생성
@router.put("/users/{user_id}")           # 사용자 수정
@router.delete("/users/{user_id}")        # 사용자 삭제

# 나쁜 예
@router.get("/getUser")                   # 동사 사용
@router.post("/createUser")               # 동사 사용
@router.get("/users/get/{id}")            # 불필요한 동사
```

### 3. 의존성 주입 (Dependency Injection)

```python
from fastapi import Depends
from app.middleware.auth import get_current_user_id
from app.services.user_service import get_user_service

@router.get("/protected")
async def protected_endpoint(
    user_id: str = Depends(get_current_user_id),  # 인증 필수
    user_service: UserService = Depends(get_user_service)  # 서비스 주입
):
    user = user_service.get_user_by_id(user_id)
    return {"user": user}
```

### 4. 요청/응답 스키마 정의

```python
from pydantic import BaseModel
from typing import Optional

class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime

@router.post("/items", response_model=ItemResponse)
async def create_item(
    item: ItemCreate,
    user_id: str = Depends(get_current_user_id)
):
    # 아이템 생성 로직
    return ItemResponse(...)
```

## 서비스 레이어 패턴

### 서비스 클래스 작성

```python
"""
[도메인] 서비스 클래스
(Single Responsibility: [도메인] 관련 비즈니스 로직만 담당)
"""
from typing import List, Optional
from app.core.supabase import get_supabase

class ItemService:
    """아이템 서비스 클래스"""
    
    def __init__(self):
        self.supabase = get_supabase()
    
    def get_items(self, user_id: str) -> List[dict]:
        """사용자의 아이템 목록 조회"""
        # 비즈니스 로직
        pass
    
    def create_item(self, user_id: str, item_data: dict) -> dict:
        """아이템 생성"""
        # 비즈니스 로직
        pass

def get_item_service() -> ItemService:
    """ItemService 인스턴스 반환"""
    return ItemService()
```

### 라우터에서 서비스 사용

```python
from app.services.item_service import get_item_service

@router.get("/items")
async def list_items(
    user_id: str = Depends(get_current_user_id),
    item_service: ItemService = Depends(get_item_service)
):
    items = item_service.get_items(user_id)
    return {"items": items}
```

## 에러 처리

### HTTP 예외 사용

```python
from fastapi import HTTPException, status

@router.get("/items/{item_id}")
async def get_item(item_id: str):
    item = item_service.get_item_by_id(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    return item
```

### 커스텀 예외 처리

```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=400,
        content={"message": str(exc)}
    )
```

## API 문서화

### 엔드포인트 문서

```python
@router.post(
    "/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    summary="아이템 생성",
    description="새로운 아이템을 생성합니다.",
    response_description="생성된 아이템 정보"
)
async def create_item(
    item: ItemCreate,
    user_id: str = Depends(get_current_user_id)
):
    """아이템 생성 엔드포인트"""
    pass
```

### API 문서 접근

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 인증 및 권한

### 공개 엔드포인트

```python
@router.get("/public")
async def public_endpoint():
    """인증 없이 접근 가능"""
    return {"message": "public"}
```

### 보호된 엔드포인트

```python
@router.get("/protected")
async def protected_endpoint(
    user_id: str = Depends(get_current_user_id)
):
    """인증 필수"""
    return {"user_id": user_id}
```

## CORS 설정

`apps/backend/main.py`에서 CORS 설정:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 테스트

### API 테스트 예제

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_public_endpoint():
    response = client.get("/api/example/public")
    assert response.status_code == 200

def test_protected_endpoint():
    # 토큰 없이 요청
    response = client.get("/api/example/protected")
    assert response.status_code == 401
    
    # 토큰과 함께 요청
    headers = {"Authorization": f"Bearer {test_token}"}
    response = client.get("/api/example/protected", headers=headers)
    assert response.status_code == 200
```

## 성능 고려사항

1. **데이터베이스 쿼리 최적화**
   - 필요한 필드만 조회
   - 인덱스 활용
   - 페이지네이션 적용

2. **캐싱**
   - 자주 조회되는 데이터는 캐싱 고려

3. **비동기 처리**
   - I/O 작업은 async/await 사용
   - CPU 집약적 작업은 별도 스레드 처리

