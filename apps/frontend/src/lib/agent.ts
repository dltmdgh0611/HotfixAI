export type FileMap = Record<string, string>

// 부분 패치: search/replace 방식
export type AgentPatch = {
  file: string
  action: 'search_replace' | 'delete'
  search?: string
  replace?: string
}

export type AgentResponse = {
  patches: AgentPatch[]
}

export type AgentRewriteResponse = {
  files: { name: string; content: string }[]
  summary?: string
  appliedCount?: number
  failedCount?: number
}

// 서버 API 호출: gpt-5-mini 에이전트
export async function requestCodePatches(params: {
  message: string
  files: { name: string; content: string }[]
}): Promise<AgentResponse> {
  const resp = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!resp.ok) {
    const error = await safeText(resp)
    throw new Error(error || 'Agent request failed')
  }

  const data = (await resp.json()) as AgentResponse
  if (!data || !Array.isArray(data.patches)) {
    return { patches: [] }
  }
  return data
}

export async function requestRewrite(params: {
  message: string
  files: { name: string; content: string }[]
}): Promise<AgentRewriteResponse> {
  const resp = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...params, mode: 'rewrite' }),
  })
  if (!resp.ok) {
    const error = await safeText(resp)
    throw new Error(error || 'Agent rewrite failed')
  }
  const data = (await resp.json()) as AgentRewriteResponse
  if (!data || !Array.isArray(data.files)) {
    return { files: [] }
  }
  return data
}

// 부분 패치 적용: search/replace 방식
export function applyPatchesToMap(fileMap: FileMap, patches: AgentPatch[]): FileMap {
  let next = { ...fileMap }
  
  for (const p of patches) {
    if (p.action === 'delete') {
      const { [p.file]: _, ...rest } = next
      next = rest
    } else if (p.action === 'search_replace') {
      const current = next[p.file]
      if (!current) continue
      if (typeof p.search !== 'string' || typeof p.replace !== 'string') continue
      
      // 정확한 문자열 치환
      if (current.includes(p.search)) {
        next[p.file] = current.replace(p.search, p.replace)
      } else {
        console.warn(`[agent] search string not found in ${p.file}`)
      }
    }
  }
  
  return next
}

// 파일 맵을 API 입력 형태로 변환
export function fileMapToArray(fileMap: FileMap): { name: string; content: string }[] {
  return Object.entries(fileMap).map(([name, content]) => ({ name, content }))
}

async function safeText(resp: Response) {
  try {
    return await resp.text()
  } catch {
    return ''
  }
}
