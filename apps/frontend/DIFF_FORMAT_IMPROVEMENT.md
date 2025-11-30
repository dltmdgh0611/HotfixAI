# AI Diff 출력 일관성 개선 방안

## 🎯 목표: 100% 성공률 달성

---

## 📊 현재 문제점

### 1. **프롬프트 엔지니어링 부족**
- Few-shot examples가 없음
- 나쁜 예시와 좋은 예시가 명확하지 않음
- 규칙이 충분히 엄격하지 않음

### 2. **출력 형식 검증 부족**
- 파싱 실패 시 재시도 로직이 없음
- 출력 검증이 약함

### 3. **AI 모델 설정 최적화 부족**
- Temperature가 설정되어 있지 않음 (기본값 1.0 사용 추정)
- JSON mode를 사용하지 않음

---

## ✅ 해결 방안 (우선순위 순)

### **방안 1: JSON 구조화 응답 강제 ⭐⭐⭐⭐⭐**
가장 효과적! OpenAI의 JSON mode를 사용하면 거의 100% 보장됩니다.

**장점:**
- 파싱 실패가 거의 없음
- 구조화된 데이터로 검증 쉬움
- 모델이 JSON을 생성하도록 강제됨

**구현:**
```typescript
// 시스템 프롬프트
const system = `당신은 웹 개발 전문가입니다. 
반드시 다음 JSON 형식으로 응답하세요:

{
  "changes": [
    {
      "search": "원본 코드 (정확히 일치해야 함, 공백/들여쓰기 포함)",
      "replace": "수정된 코드",
      "description": "변경 이유 간단 설명"
    }
  ],
  "summary": "전체 변경사항 요약"
}

규칙:
1. search는 현재 코드와 100% 일치해야 함
2. search에는 충분한 컨텍스트(최소 5줄) 포함
3. 여러 변경사항이 있으면 changes 배열에 모두 포함
4. 빈 배열이 아닌 최소 1개 이상의 변경사항 포함`

// API 요청
{
  model: 'gpt-4o-mini',
  response_format: { type: 'json_object' }, // ✅ JSON mode 활성화
  temperature: 0.1, // ✅ 낮은 온도로 일관성 증가
  messages: [...]
}
```

---

### **방안 2: Few-shot Examples 추가 ⭐⭐⭐⭐**
AI에게 좋은 예시를 명확히 보여줍니다.

**구현:**
```typescript
const system = `당신은 웹 개발 전문가입니다.

반드시 다음 형식으로 응답하세요:

<<<<<<< SEARCH
[원본 코드 - 정확히 복사, 공백/들여쓰기 포함]
=======
[수정된 코드]
>>>>>>> REPLACE

✅ 좋은 예시:
사용자: "버튼 색상을 파란색으로 변경해주세요"

<<<<<<< SEARCH
<button style={{
  background: 'red',
  color: 'white',
  padding: '10px 20px'
}}>
  클릭
</button>
=======
<button style={{
  background: 'blue',
  color: 'white',
  padding: '10px 20px'
}}>
  클릭
</button>
>>>>>>> REPLACE

❌ 나쁜 예시:
- 전체 파일을 다시 작성
- SEARCH 부분이 원본과 다름
- 마커 없이 코드만 출력
- SEARCH 범위가 너무 좁음 (1-2줄)

중요 규칙:
1. SEARCH는 현재 코드와 100% 일치
2. SEARCH에는 5~15줄 컨텍스트 포함
3. 마커는 정확히 위 형식대로
4. 여러 변경사항은 블록 반복`
```

---

### **방안 3: 출력 검증 및 재시도 로직 ⭐⭐⭐⭐**
파싱 실패 시 자동으로 재시도합니다.

**구현:**
```typescript
async function requestRewriteWithRetry(params: {
  message: string
  files: FileInput[]
  maxRetries?: number
}): Promise<AgentRewriteResponse> {
  const maxRetries = params.maxRetries || 3
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await callOpenAI(params)
      const diffs = parseDiffs(response)
      
      // ✅ 검증: 최소 1개 이상의 diff
      if (diffs.length === 0) {
        throw new Error('AI가 SEARCH/REPLACE 형식으로 응답하지 않았습니다.')
      }
      
      // ✅ 검증: search 문자열이 너무 짧지 않은지
      const hasValidDiffs = diffs.some(d => d.search.length > 50)
      if (!hasValidDiffs) {
        throw new Error('SEARCH 범위가 너무 짧습니다.')
      }
      
      // ✅ 검증: 실제로 적용 가능한지 확인
      const file = params.files[0]
      const canApply = diffs.some(d => file.content.includes(d.search))
      if (!canApply) {
        throw new Error('SEARCH 문자열이 원본 코드와 일치하지 않습니다.')
      }
      
      // 성공!
      return applyDiffs(file, diffs)
      
    } catch (error) {
      console.warn(`[agent] 시도 ${attempt}/${maxRetries} 실패:`, error)
      lastError = error as Error
      
      if (attempt < maxRetries) {
        // 재시도 시 더 명확한 지시 추가
        params.message = `[중요] 이전 시도가 실패했습니다. 반드시 SEARCH/REPLACE 형식을 정확히 따라주세요.\n\n원래 요청: ${params.message}`
      }
    }
  }
  
  throw lastError || new Error('최대 재시도 횟수 초과')
}
```

---

### **방안 4: 시스템 프롬프트 강화 ⭐⭐⭐**
더 엄격하고 명확한 지시사항을 제공합니다.

**구현:**
```typescript
const system = `당신은 웹 개발 전문가입니다.

🚨 매우 중요 - 반드시 준수:

1. 절대 전체 파일을 다시 쓰지 마세요
2. 변경이 필요한 부분만 SEARCH/REPLACE 블록으로 작성
3. 다른 설명이나 코멘트를 추가하지 마세요
4. 마커 형식을 정확히 지켜주세요

출력 형식 (이것만 출력):
<<<<<<< SEARCH
[원본 코드 - 최소 5줄, 최대 50줄]
=======
[수정된 코드]
>>>>>>> REPLACE

규칙:
- SEARCH: 현재 파일에서 정확히 찾을 수 있는 코드
- 공백, 들여쓰기, 줄바꿈 모두 정확히 일치해야 함
- 충분한 컨텍스트 포함 (변경 위치 명확히 식별)
- 여러 변경사항은 위 블록을 반복

금지사항:
❌ "다음과 같이 수정하세요", "코드 설명" 등 추가 텍스트
❌ 코드 블록 (```) 사용
❌ SEARCH 부분을 요약하거나 생략
❌ 마커 형식 변경`
```

---

### **방안 5: 모델 파라미터 최적화 ⭐⭐⭐**
일관성을 높이는 파라미터 설정입니다.

**구현:**
```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.1,        // ✅ 매우 낮은 온도 (일관성 ↑)
  top_p: 0.1,             // ✅ 낮은 top_p (결정론적 ↑)
  frequency_penalty: 0.0,  // 반복 패널티 없음
  presence_penalty: 0.0,   // 존재 패널티 없음
  seed: 12345,            // ✅ 동일한 입력에 동일한 출력 (재현성)
  response_format: { type: 'json_object' }, // JSON mode
}
```

---

### **방안 6: 파싱 로직 강화 ⭐⭐**
더 관대하고 유연한 파싱을 구현합니다.

**구현:**
```typescript
function parseDiffs(text: string): Array<{ search: string; replace: string }> {
  const diffs: Array<{ search: string; replace: string }> = []
  
  // 여러 패턴 시도 (유연성 증가)
  const patterns = [
    // 표준 형식
    /<<<<<<< SEARCH\s*\n([\s\S]*?)\n=======\s*\n([\s\S]*?)\n>>>>>>> REPLACE/g,
    // 공백 변형
    /<<<<<<< SEARCH\s*([\s\S]*?)=======\s*([\s\S]*?)>>>>>>> REPLACE/g,
    // 대소문자 무시
    /<<<<<<< search\s*\n([\s\S]*?)\n=======\s*\n([\s\S]*?)\n>>>>>>> replace/gi,
  ]
  
  for (const regex of patterns) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      const search = match[1].trim()
      const replace = match[2].trim()
      
      // 최소 길이 검증
      if (search.length > 20) {
        diffs.push({ search, replace })
      }
    }
    
    if (diffs.length > 0) break // 성공하면 중단
  }
  
  return diffs
}
```

---

## 🎯 추천 구현 순서

### Phase 1: 즉각적인 개선 (1시간)
1. ✅ **JSON mode 적용** (방안 1)
2. ✅ **Temperature 0.1 설정** (방안 5)
3. ✅ **시스템 프롬프트 강화** (방안 4)

### Phase 2: 안정성 강화 (2시간)
4. ✅ **Few-shot examples 추가** (방안 2)
5. ✅ **출력 검증 로직** (방안 3)

### Phase 3: 완벽성 추구 (1시간)
6. ✅ **재시도 메커니즘** (방안 3)
7. ✅ **파싱 로직 강화** (방안 6)

---

## 📈 예상 성공률

| 구현 단계 | 예상 성공률 | 비고 |
|---------|-----------|------|
| 현재 | 70-80% | 기본 프롬프트만 |
| Phase 1 | 90-95% | JSON mode + 낮은 temperature |
| Phase 2 | 95-98% | Few-shot + 검증 |
| Phase 3 | 98-99.9% | 재시도 + 유연한 파싱 |

---

## 💡 핵심 포인트

### ⭐ 가장 효과적인 방법
**JSON mode (방안 1)** + **낮은 temperature (방안 5)** 조합이 가장 강력합니다.
이 두 가지만 적용해도 90% 이상의 성공률을 기대할 수 있습니다.

### 🔄 재시도가 필요한 이유
AI는 확률적 모델이므로 100% 보장은 불가능합니다.
하지만 재시도를 통해 **99.9%** 수준까지 끌어올릴 수 있습니다.

### 📝 프롬프트 엔지니어링의 중요성
명확한 예시와 엄격한 규칙이 있으면 AI의 출력이 훨씬 일관적입니다.

---

## 🚀 즉시 적용 가능한 코드

다음 메시지에서 실제 구현 코드를 제공하겠습니다!


