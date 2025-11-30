'use server'

import type { NextRequest } from 'next/server'

// 요청 바디 타입
type FileInput = { name: string; content: string }
type AgentRequest = {
  message: string
  files: FileInput[]
  mode?: 'patch' | 'rewrite'
}

// SEARCH/REPLACE diff 형식
export type AgentPatch = {
  file: string
  action: 'search_replace'
  search: string
  replace: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentRequest
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY is missing' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      )
    }

    // INPUT 로그
    try {
      console.log('[agent][input] message:', body.message?.slice(0, 200) || '(empty)')
      console.log('[agent][input] files:', {
        count: body.files?.length || 0,
        names: (body.files || []).map(f => f.name).slice(0, 20)
      })
    } catch {}

    const mode = body.mode === 'patch' ? 'patch' : 'rewrite'

    // JSON mode로 구조화된 응답 강제 (일관성 ↑↑↑)
    const system = [
      '당신은 웹 개발 전문가입니다. 코드를 효율적으로 수정합니다.',
      '',
      '🚨 매우 중요 - 반드시 JSON 형식으로만 응답:',
      '',
      '{',
      '  "changes": [',
      '    {',
      '      "search": "원본 코드 (정확히 일치, 공백/들여쓰기 포함, 최소 5줄 컨텍스트)",',
      '      "replace": "수정된 코드",',
      '      "description": "변경 이유 간단 설명"',
      '    }',
      '  ],',
      '  "summary": "전체 변경사항 요약"',
      '}',
      '',
      '✅ 좋은 예시:',
      '사용자: "버튼 색상을 파란색으로 변경"',
      '응답:',
      '{',
      '  "changes": [{',
      '    "search": "<button\\n  onClick={handleClick}\\n  style={{\\n    background: \'red\',\\n    color: \'white\',\\n    padding: \'10px 20px\'\\n  }}\\n>\\n  클릭\\n</button>",',
      '    "replace": "<button\\n  onClick={handleClick}\\n  style={{\\n    background: \'blue\',\\n    color: \'white\',\\n    padding: \'10px 20px\'\\n  }}\\n>\\n  클릭\\n</button>",',
      '    "description": "버튼 배경색을 red에서 blue로 변경"',
      '  }],',
      '  "summary": "버튼의 배경색을 빨간색에서 파란색으로 변경했습니다."',
      '}',
      '',
      '중요 규칙:',
      '1. search는 현재 코드와 100% 일치 (공백, 들여쓰기, 줄바꿈 모두 동일)',
      '2. search에는 충분한 컨텍스트 포함 (최소 5줄, 최대 50줄)',
      '3. 여러 변경사항이 있으면 changes 배열에 모두 포함',
      '4. 유효한 JSON 형식만 출력 (추가 설명 금지)',
      '5. 전체 파일을 다시 쓰지 말고 필요한 부분만 변경',
      '',
      '❌ 금지사항:',
      '- JSON 외의 텍스트 출력',
      '- search 부분을 요약하거나 생략',
      '- 마크다운 코드 블록 사용',
      '- search가 원본과 다름',
    ].join('\n')

    // 첫 번째 파일만 사용 (단일 파일 diff)
    const targetFile = body.files[0]
    if (!targetFile) {
      return new Response(JSON.stringify({ error: '파일이 제공되지 않았습니다.' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }

    const user = [
      `파일: ${targetFile.name}`,
      '',
      '현재 코드:',
      '```',
      targetFile.content,
      '```',
      '',
      `사용자 요청: ${body.message}`,
      '',
      '위 규칙에 따라 변경사항을 SEARCH/REPLACE 형식으로 작성해주세요.',
    ].join('\n')

    const bodyPayload: any = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_completion_tokens: 16000,
      temperature: 0.1,           // ✅ 매우 낮은 온도로 일관성 증가
      top_p: 0.1,                 // ✅ 결정론적 출력
      response_format: { type: 'json_object' }, // ✅ JSON mode 강제
    }

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
    })

    if (!resp.ok) {
      const text = await resp.text()
      console.error('[agent][openai] error', text)
      return new Response(JSON.stringify({ error: text }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      })
    }

    const data = await resp.json()
    console.log('[agent][openai] model:', data.model, 'tokens:', data.usage?.total_tokens)

    const aiResponse = data.choices?.[0]?.message?.content || ''
    
    // JSON 응답 파싱
    let parsedResponse: { changes: Array<{ search: string; replace: string; description?: string }>; summary?: string }
    try {
      parsedResponse = JSON.parse(aiResponse)
    } catch (parseError) {
      console.error('[agent][parse] JSON 파싱 실패:', parseError)
      // Fallback: 기존 SEARCH/REPLACE 형식으로 시도
      const legacyDiffs = parseLegacyDiffs(aiResponse)
      if (legacyDiffs.length > 0) {
        parsedResponse = { changes: legacyDiffs, summary: '' }
      } else {
        return new Response(
          JSON.stringify({ 
            error: 'AI가 올바른 JSON 형식으로 응답하지 않았습니다.',
            aiResponse: aiResponse.slice(0, 500)
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
      }
    }
    
    const diffs = parsedResponse.changes || []
    
    // ✅ 검증 1: 최소 1개 이상의 변경사항
    if (diffs.length === 0) {
      console.log('[agent][output] 변경사항 없음')
      return new Response(
        JSON.stringify({ 
          error: 'AI가 변경사항을 제안하지 않았습니다.',
          aiResponse: aiResponse.slice(0, 500)
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }
    
    // ✅ 검증 2: search 문자열이 충분히 긴지 확인
    const hasValidSearch = diffs.every(d => d.search && d.search.length > 20)
    if (!hasValidSearch) {
      console.warn('[agent][validation] search 문자열이 너무 짧음')
    }
    
    // ✅ 검증 3: 실제로 원본 코드에 존재하는지 확인
    const matchableCount = diffs.filter(d => targetFile.content.includes(d.search)).length
    if (matchableCount === 0) {
      console.error('[agent][validation] 어떤 search도 원본 코드와 일치하지 않음')
      return new Response(
        JSON.stringify({ 
          error: 'AI가 제안한 변경사항이 원본 코드와 일치하지 않습니다. 다시 시도해주세요.',
          details: diffs.map(d => ({ searchPreview: d.search.substring(0, 100) }))
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    }

    // 변경사항 적용
    let modifiedContent = targetFile.content
    let appliedCount = 0
    const failedDiffs: string[] = []
    const appliedDiffs: Array<{ search: string; replace: string; description?: string }> = []

    for (const diff of diffs) {
      if (modifiedContent.includes(diff.search)) {
        modifiedContent = modifiedContent.replace(diff.search, diff.replace)
        appliedCount++
        appliedDiffs.push(diff)
        console.log('[agent][diff] ✅ 적용 성공:', diff.description || '변경사항')
      } else {
        const preview = diff.search.substring(0, 80).replace(/\n/g, '↵')
        failedDiffs.push(preview)
        console.warn('[agent][diff] ❌ 일치하는 코드 없음:', preview)
      }
    }

    console.log('[agent][output] diff 결과:', { 
      total: diffs.length, 
      applied: appliedCount, 
      failed: failedDiffs.length,
      successRate: `${((appliedCount / diffs.length) * 100).toFixed(1)}%`
    })

    // 요약 사용: JSON 응답에 포함된 summary 또는 생성
    let summaryText = parsedResponse.summary || ''
    
    // summary가 없거나 너무 짧으면 자동 생성
    if (!summaryText || summaryText.length < 10) {
      try {
        const changeDescriptions = appliedDiffs.map((d, i) => 
          `${i + 1}. ${d.description || '코드 변경'}`
        ).join('\n')

        const summaryPrompt = [
          `파일 ${targetFile.name}에서 ${appliedCount}개 변경사항을 적용했습니다:`,
          '',
          changeDescriptions,
          '',
          '위 변경사항을 사용자에게 2~3문장으로 간결하게 설명하세요.',
          '불릿/코드블록/마크다운 금지.',
        ].join('\n')

        const sumResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: '변경 요약가. 사용자에게 변경사항을 간결히 설명한다.' },
              { role: 'user', content: summaryPrompt },
            ],
            max_completion_tokens: 800,
            temperature: 0.3,
          }),
        })
        const sumData = await sumResp.json()
        summaryText = sumData?.choices?.[0]?.message?.content?.trim() || ''
      } catch (err) {
        console.warn('[agent][summary] 요약 생성 실패:', err)
      }
    }

    return new Response(
      JSON.stringify({ 
        files: [{ name: targetFile.name, content: modifiedContent }],
        summary: summaryText,
        appliedCount,
        failedCount: failedDiffs.length,
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (e: any) {
    console.error('[agent] error', e)
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}

// Legacy SEARCH/REPLACE diff 파싱 함수 (Fallback용)
function parseLegacyDiffs(text: string): Array<{ search: string; replace: string; description?: string }> {
  const diffs: Array<{ search: string; replace: string; description?: string }> = []
  
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
        diffs.push({ 
          search, 
          replace,
          description: 'Legacy format change'
        })
      }
    }
    
    if (diffs.length > 0) break // 성공하면 중단
  }
  
  return diffs
}
