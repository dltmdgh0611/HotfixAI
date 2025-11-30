'use client'

import { useState, useRef, useEffect } from 'react'
import { requestCodePatches, requestRewrite, fileMapToArray } from '@/lib/agent'
import { SelectedElement } from '@/types/element-selector'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatPanelProps {
  fileMap: Record<string, string>
  selectedFile: string
  selectedElement: SelectedElement | null
  onUpdateFile: (filename: string, content: string) => void
  onApplyPatches: (patches: import('@/lib/agent').AgentPatch[]) => void
  onRevertPatches: (patches: import('@/lib/agent').AgentPatch[]) => void
  onClearSelectedElement?: () => void
}

type ChangeBundle = {
  id: string
  patches: import('@/lib/agent').AgentPatch[]
  inverse: import('@/lib/agent').AgentPatch[]
  summary: string
  reverted?: boolean
}

export default function ChatPanel({ 
  fileMap, 
  selectedFile, 
  selectedElement,
  onUpdateFile, 
  onApplyPatches, 
  onRevertPatches,
  onClearSelectedElement 
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [changes, setChanges] = useState<ChangeBundle[]>([])
  // 항상 활성화된 옵션들
  const includeRelated = true
  const rewriteMode = true
  const [lastDiagnostics, setLastDiagnostics] = useState<{ sentFiles: string[]; totalChars: number } | null>(null)

  // agent - 상단 import 사용

  useEffect(() => {
    // 초기 메시지 불러오기
    const initialMessage = localStorage.getItem('initialMessage')
    if (initialMessage && messages.length === 0) {
      setMessages([
        {
          role: 'user',
          content: initialMessage,
        },
        {
          role: 'assistant',
          content: '안녕하세요! 업로드하신 파일을 확인했습니다. 어떤 수정을 도와드릴까요?',
        },
      ])
      localStorage.removeItem('initialMessage')
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    setIsProcessing(true)

    // 선택된 요소 정보를 메시지에 포함
    let fullMessage = userMessage
    if (selectedElement) {
      const elementContext = formatElementContext(selectedElement)
      fullMessage = `${elementContext}\n\n사용자 요청: ${userMessage}`
    }

    // 사용자 메시지 추가 (UI에는 원본만 표시)
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ]
    setMessages(newMessages)

    // 에이전트 호출
    try {
      // 선택한 파일만 전송하여 토큰 사용 최소화
      const narrowedMap: Record<string, string> = {}
      if (selectedFile && fileMap[selectedFile] !== undefined) {
        narrowedMap[selectedFile] = fileMap[selectedFile]
      } else {
        // 폴백: 아무 것도 선택되지 않은 경우 첫 번째 파일 1개
        const first = Object.keys(fileMap)[0]
        if (first) narrowedMap[first] = fileMap[first]
      }

      // 선택 파일이 HTML이고 연관 포함이 켜져 있으면, 같은 디렉터리의 참조된 css/js를 추가
      if (includeRelated) {
        const key = Object.keys(narrowedMap)[0]
        if (key && /\.(html?|htm)$/i.test(key)) {
          const html = narrowedMap[key] || ''
          const dir = key.includes('/') ? key.slice(0, key.lastIndexOf('/')) : ''
          const hrefs = Array.from(html.matchAll(/<link\b[^>]*?href=["']([^"']+)["']/gi)).map(m => m[1])
          const srcs = Array.from(html.matchAll(/<script\b[^>]*?src=["']([^"']+)["']/gi)).map(m => m[1])
          const refs = [...hrefs, ...srcs]
          const stripLeadingSlash = (p: string) => p.replace(/^\/+/, '')
          const normalize = (p: string) => {
            const parts = p.split('/')
            const stack: string[] = []
            for (const part of parts) {
              if (!part || part === '.') continue
              if (part === '..') stack.pop()
              else stack.push(part)
            }
            return stack.join('/')
          }
          const toCandidates = (ref: string) => {
            const clean = ref.replace(/[?#].*$/, '')
            const rel = dir ? normalize(`${dir}/${clean}`) : clean
            const direct = stripLeadingSlash(clean)
            return [rel, direct, stripLeadingSlash(rel)]
          }
          const tryResolve = (ref: string) => {
            for (const cand of toCandidates(ref)) {
              if (fileMap[cand] !== undefined) return cand
            }
            // suffix 최장 일치
            let best: string | null = null
            for (const k of Object.keys(fileMap)) {
              if (k.toLowerCase().endsWith(ref.toLowerCase()) || k.toLowerCase().endsWith(toCandidates(ref)[0].toLowerCase())) {
                if (!best || k.length > best.length) best = k
              }
            }
            return best
          }
          for (const r of refs) {
            const resolved = tryResolve(r)
            if (resolved && narrowedMap[resolved] === undefined) {
              narrowedMap[resolved] = fileMap[resolved]
            }
          }
        }
      }

      // 진단 정보 저장
      const sentFiles = Object.keys(narrowedMap)
      const totalChars = sentFiles.reduce((acc, k) => acc + (narrowedMap[k]?.length || 0), 0)
      setLastDiagnostics({ sentFiles, totalChars })

      const prologue = `/* context
selectedFile: ${selectedFile || '(none)'}
sentFiles: ${sentFiles.join(', ')}
*/\n`

      // SEARCH/REPLACE diff 모드로 처리
      const key = Object.keys(narrowedMap)[0]
      if (!key) throw new Error('선택된 파일이 없습니다.')
      
      const rewriteRes = await requestRewrite({
        message: fullMessage, // ✅ 선택된 요소 컨텍스트 포함
        files: [{ name: key, content: narrowedMap[key] }],
      })
      
      const rewritten = rewriteRes.files?.[0]
      if (rewritten && typeof rewritten.content === 'string') {
        onUpdateFile(rewritten.name, rewritten.content)
        // 서버에서 받은 요약 표시
        const reply = (rewriteRes.summary || '').trim()
        const appliedInfo = rewriteRes.appliedCount ? ` (${rewriteRes.appliedCount}개 변경 적용)` : ''
        setMessages(prev => [...prev, { role: 'assistant', content: (reply || '파일을 수정했습니다.') + appliedInfo }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '변경사항이 없습니다. 요청을 더 구체화해 보세요.' }])
      }
    } catch (e: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `에이전트 오류: ${e?.message || e}` },
      ])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 선택된 요소 정보를 포맷팅
  function formatElementContext(element: SelectedElement): string {
    const parts = [
      `[선택된 요소 정보]`,
      `- 태그: <${element.tagName.toLowerCase()}>`,
    ]
    
    if (element.id) {
      parts.push(`- ID: #${element.id}`)
    }
    
    if (element.className) {
      parts.push(`- 클래스: ${element.className}`)
    }
    
    if (element.innerText && element.innerText.trim()) {
      parts.push(`- 텍스트: "${element.innerText.trim()}"`)
    }
    
    parts.push(`- CSS 선택자: ${element.selector}`)
    
    if (element.sourceFile) {
      parts.push(`- 파일: ${element.sourceFile}`)
    }
    
    if (element.approximateLine) {
      parts.push(`- 코드 위치: 약 ${element.approximateLine}줄 근처`)
    }
    
    if (element.outerHTML) {
      const preview = element.outerHTML.length > 200 
        ? element.outerHTML.substring(0, 200) + '...' 
        : element.outerHTML
      parts.push(`- HTML 미리보기:\n${preview}`)
    }
    
    return parts.join('\n')
  }

  function renderAssistantControls(idx: number) {
    const msg = messages[idx]
    if (msg.role !== 'assistant') return null
    // 해당 메시지에 가장 최근 변경을 매칭
    const change = changes[changes.length - 1]
    if (!change || change.reverted) return null
    return (
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button
          className="btn btn-secondary"
          onClick={() => {
            onRevertPatches(change.inverse)
            setChanges(prev => prev.map(c => c.id === change.id ? { ...c, reverted: true } : c))
            setMessages(prev => [...prev, { role: 'assistant', content: '직전 변경을 취소했습니다.' }])
          }}
          style={{ padding: '6px 10px', fontSize: 12 }}
        >
          취소
        </button>
      </div>
    )
  }

  return (
    <div className="chat-container">
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>AI 어시스턴트</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          코드 수정 요청을 입력하세요
        </p>
        {lastDiagnostics && (
          <div style={{ marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              전송 파일 {lastDiagnostics.sentFiles.length}개 · 문자수 {lastDiagnostics.totalChars.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontSize: '14px' }}>대화를 시작해보세요</div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className="chat-message">
            <div className={`chat-avatar ${msg.role === 'user' ? 'chat-avatar-user' : 'chat-avatar-assistant'}`}>
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="chat-content">
              <div className="chat-role">
                {msg.role === 'user' ? '사용자' : 'AI 어시스턴트'}
              </div>
              <div className="chat-text">{msg.content}</div>
              {renderAssistantControls(idx)}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="chat-message">
            <div className="chat-avatar chat-avatar-assistant">🤖</div>
            <div className="chat-content">
              <div className="chat-role">AI 어시스턴트</div>
              <div className="chat-text" style={{ color: 'var(--color-text-muted)' }}>
                처리 중...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-container">
        {/* 선택된 요소 표시 */}
        {selectedElement && (
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1px solid #93c5fd',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '16px' }}>🎯</span>
                <span style={{ fontWeight: 600, color: '#1e40af' }}>선택된 요소</span>
              </div>
              <button
                onClick={() => onClearSelectedElement?.()}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px',
                  lineHeight: 1,
                }}
                title="선택 해제"
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gap: '4px', color: '#1e40af' }}>
              <div>
                <span style={{ fontWeight: 600 }}>태그:</span>{' '}
                <code style={{ background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                  &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </code>
                {selectedElement.id && (
                  <>
                    {' '}
                    <code style={{ background: 'rgba(255,255,255,0.7)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                      #{selectedElement.id}
                    </code>
                  </>
                )}
              </div>
              
              {selectedElement.className && (
                <div>
                  <span style={{ fontWeight: 600 }}>클래스:</span>{' '}
                  <span style={{ fontSize: '12px' }}>{selectedElement.className}</span>
                </div>
              )}
              
              {selectedElement.innerText && (
                <div>
                  <span style={{ fontWeight: 600 }}>텍스트:</span>{' '}
                  <span style={{ fontSize: '12px' }}>"{selectedElement.innerText.substring(0, 50)}{selectedElement.innerText.length > 50 ? '...' : ''}"</span>
                </div>
              )}
              
              <div>
                <span style={{ fontWeight: 600 }}>위치:</span>{' '}
                <span style={{ fontSize: '12px' }}>{selectedElement.sourceFile} (약 {selectedElement.approximateLine}줄)</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="chat-input-wrapper">
          <input
            type="text"
            className="input"
            placeholder={selectedElement ? "선택한 요소에 대해 물어보세요..." : "메시지를 입력하세요..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
          >
            전송
          </button>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--color-text-muted)',
            marginTop: '8px',
          }}
        >
          Enter로 전송 • Shift+Enter로 줄바꿈
          {selectedElement && <span style={{ color: '#3b82f6', marginLeft: '8px' }}>• 🎯 요소가 선택되었습니다</span>}
        </div>
      </div>
    </div>
  )
}
