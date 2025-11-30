'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ChatPanel from '@/components/studio/chat-panel'
import WebviewPreview from '@/components/studio/webview-preview'
import FileTree from '@/components/studio/file-tree'
import { loadInitialFiles, generatePreviewUrl, pickDefaultHtmlFile } from '@/lib/files'
import { AgentPatch, applyPatchesToMap } from '@/lib/agent'
import { SelectedElement } from '@/types/element-selector'

export default function StudioPage() {
  const router = useRouter()
  const [fileMap, setFileMap] = useState<Record<string, string>>({})
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [selectedHtml, setSelectedHtml] = useState<string>('')
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uHost, setUHost] = useState('')
  const [uPort, setUPort] = useState('8010')
  const [uUser, setUUser] = useState('')
  const [uPass, setUPass] = useState('')
  const [uBase, setUBase] = useState('/')
  const [uIsUploading, setUIsUploading] = useState(false)

  useEffect(() => {
    const files = loadInitialFiles()
    setFileMap(files)
    const defaultHtml = pickDefaultHtmlFile(files)
    setSelectedHtml(defaultHtml || '')
    setPreviewUrl(generatePreviewUrl(files, defaultHtml || undefined))

    const fileNames = Object.keys(files)
    if (fileNames.length > 0) {
      setSelectedFile(fileNames[0])
    }

    // 디버그: 로드된 파일 트리 출력
    try {
      const buildTree = (names: string[]) => {
        const root: any = {}
        for (const name of names) {
          const parts = name.split('/').filter(Boolean)
          let node = root
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            const isFile = i === parts.length - 1
            if (!node[part]) node[part] = isFile ? null : {}
            node = node[part] || node
          }
        }
        return root
      }
      const printTree = (node: any, prefix = '') => {
        const entries = Object.keys(node).sort()
        for (const key of entries) {
          const isFile = node[key] === null
          console.log(`${prefix}${isFile ? '📄' : '📁'} ${key}`)
          if (!isFile) {
            printTree(node[key], `${prefix}  `)
          }
        }
      }
      console.log('[CLIENT][Studio] Loaded files:', { count: fileNames.length })
      console.log('[CLIENT][Studio] File tree:')
      printTree(buildTree(fileNames))
      if (!('index.html' in files) && !('index.htm' in files)) {
        console.warn('[CLIENT][Studio] index.html / index.htm 이 없어 프리뷰가 비어 있을 수 있습니다.')
      }
    } catch {}
  }, [])

  const handleUpdateFile = (filename: string, content: string) => {
    const updated = { ...fileMap, [filename]: content }
    setFileMap(updated)
    const entry = selectedHtml || pickDefaultHtmlFile(updated) || undefined
    setSelectedHtml(entry || '')
    setPreviewUrl(generatePreviewUrl(updated, entry))
    
    // DB에 저장
    saveFileToDb(filename, content)
  }

  const handleApplyPatches = (patches: AgentPatch[]) => {
    setFileMap((prev) => {
      const next = applyPatchesToMap(prev, patches)
      const entry = selectedHtml || pickDefaultHtmlFile(next) || undefined
      setSelectedHtml(entry || '')
      setPreviewUrl(generatePreviewUrl(next, entry))
      // 선택 파일이 삭제되었으면 첫 파일로 이동
      const keys = Object.keys(next)
      if (!keys.includes(selectedFile) && keys.length > 0) {
        setSelectedFile(keys[0])
      }
      
      // 변경된 파일들 DB에 저장
      patches.forEach(patch => {
        if (next[patch.file]) {
          saveFileToDb(patch.file, next[patch.file])
        }
      })
      
      return next
    })
  }

  // DB에 파일 저장
  async function saveFileToDb(fileName: string, content: string) {
    try {
      const projectId = sessionStorage.getItem('hotfixAI.projectId')
      if (!projectId) return // 프로젝트 ID가 없으면 저장하지 않음
      
      await fetch('/api/files/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, fileName, content })
      })
    } catch (error) {
      console.error('[Studio] Failed to save file to DB:', error)
    }
  }

  const handleRevertPatches = (patches: AgentPatch[]) => {
    setFileMap((prev) => {
      const next = applyPatchesToMap(prev, patches)
      const entry = selectedHtml || pickDefaultHtmlFile(next) || undefined
      setSelectedHtml(entry || '')
      setPreviewUrl(generatePreviewUrl(next, entry))
      const keys = Object.keys(next)
      if (!keys.includes(selectedFile) && keys.length > 0) {
        setSelectedFile(keys[0])
      }
      return next
    })
  }

  const handleFileSelect = (filename: string) => {
    setSelectedFile(filename)
    const lower = filename.toLowerCase()
    if (lower.endsWith('.html') || lower.endsWith('.htm')) {
      setSelectedHtml(filename)
      setPreviewUrl(generatePreviewUrl(fileMap, filename))
    }
  }

  async function handleUpload() {
    try {
      setUIsUploading(true)
      const files = Object.entries(fileMap).map(([name, content]) => ({ name, content }))
      const protocol = (uPort === '22' || uPort === '8010') ? 'sftp' : 'ftp'
      const res = await fetch('/api/ftp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: uHost,
          port: Number(uPort),
          username: uUser,
          password: uPass,
          path: uBase,
          protocol,
          files
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || '업로드 실패')
      setShowUploadModal(false)
      alert('업로드 완료')
    } catch (e: any) {
      alert(`업로드 오류: ${e?.message || e}`)
    } finally {
      setUIsUploading(false)
    }
  }

  return (
    <div className="studio-layout">
      {/* Header */}
      <div className="studio-header">
        <div className="flex-between" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn btn-secondary btn-icon"
              onClick={() => router.push('/start')}
              title="프로젝트 목록으로"
            >
              ←
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-600)',
                }}
              />
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>HotfixAI Studio</h2>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge" style={{ fontSize: '11px' }}>
              {Object.keys(fileMap).length} 파일
            </span>
            <button
              className="btn btn-primary"
              onClick={() => setShowUploadModal(true)}
              title="FTP/SFTP로 업로드"
            >
              배포(FTP 업로드)
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="studio-main">
        {/* Left: Chat Panel */}
        <div className="studio-panel studio-panel-left">
          <ChatPanel
            fileMap={fileMap}
            selectedFile={selectedFile}
            selectedElement={selectedElement}
            onUpdateFile={handleUpdateFile}
            onApplyPatches={handleApplyPatches}
            onRevertPatches={handleRevertPatches}
            onClearSelectedElement={() => setSelectedElement(null)}
          />
        </div>

        {/* Center: Preview */}
        <div className="studio-panel studio-panel-center">
          <WebviewPreview 
            src={previewUrl}
          />
        </div>

        {/* Right: File Tree */}
        <div className="studio-panel studio-panel-right">
          <FileTree
            files={Object.keys(fileMap)}
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
          />
        </div>
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => !uIsUploading && setShowUploadModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 520, background: 'white', borderRadius: 14, border: '1px solid #e5e7eb', boxShadow: '0 10px 24px rgba(0,0,0,0.12)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>FTP 업로드</h3>
              <button disabled={uIsUploading} onClick={() => setShowUploadModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#374151' }}>호스트</label>
                <input value={uHost} onChange={e => setUHost(e.target.value)} placeholder="예: ecimg-ftp-c01.cafe24img.com" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>계정</label>
                  <input value={uUser} onChange={e => setUUser(e.target.value)} placeholder="계정명" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>비밀번호</label>
                  <input value={uPass} onChange={e => setUPass(e.target.value)} placeholder="비밀번호" type="password" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>포트</label>
                  <input value={uPort} onChange={e => setUPort(e.target.value)} placeholder="FTP 21 / SFTP 22 또는 8010" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>기준 경로</label>
                  <input value={uBase} onChange={e => setUBase(e.target.value)} placeholder="예: / 또는 /public_html" style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button disabled={uIsUploading} className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>취소</button>
                <button disabled={uIsUploading} className="btn btn-primary" onClick={handleUpload}>{uIsUploading ? '업로드 중…' : '업로드'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
