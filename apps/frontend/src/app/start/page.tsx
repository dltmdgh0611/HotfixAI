'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FiServer, FiFilePlus, FiFolder, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi'
import { Header } from '@/components/header'

type InMemoryFile = {
  name: string
  content: string
}

type Project = {
  id: string
  name: string
  description: string | null
  sourceType: string
  ftpHost: string | null
  ftpPort: number | null
  ftpPath: string | null
  createdAt: string
  updatedAt: string
  _count: {
    files: number
  }
}

export default function StartPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [ftpHost, setFtpHost] = useState('')
  const [ftpPort, setFtpPort] = useState('')
  const [ftpUser, setFtpUser] = useState('')
  const [ftpPassword, setFtpPassword] = useState('')
  const [ftpPath, setFtpPath] = useState('/')
  const [error, setError] = useState<string | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showFtpModal, setShowFtpModal] = useState(false)
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [fetchedFiles, setFetchedFiles] = useState<InMemoryFile[] | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set())
  const [createModalType, setCreateModalType] = useState<'ftp' | 'file' | 'folder' | null>(null)
  const hasLoadedRef = useRef(false)

  // 프로젝트 목록 로드
  useEffect(() => {
    // 세션 체크 먼저
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      console.log('[StartPage] Not authenticated, redirecting to login')
      router.push('/auth/login')
      return
    }
    
    // 이미 로드했으면 중복 실행 방지
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    loadProjects()
  }, [status, router])

  async function loadProjects() {
    try {
      setIsLoading(true)
      const res = await fetch('/api/projects', {
        credentials: 'include', // 쿠키 포함
      })
      
      if (res.status === 401) {
        // 인증 실패 시 로그인 페이지로 리다이렉트
        console.log('[StartPage] Unauthorized - redirecting to login')
        window.location.href = '/auth/login'
        return
      }
      
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      } else {
        const data = await res.json()
        setError(data.error || '프로젝트를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('[StartPage] Failed to load projects:', error)
      setError('프로젝트를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // 프로젝트 클릭 시 스튜디오로 이동
  async function handleProjectClick(projectId: string) {
    try {
      setIsUploading(true)
      const res = await fetch(`/api/projects/${projectId}`, {
        credentials: 'include', // 쿠키 포함
      })
      
      if (res.status === 401) {
        router.push('/auth/login')
        return
      }
      
      if (!res.ok) throw new Error('프로젝트를 불러올 수 없습니다')
      
      const data = await res.json()
      const { project } = data
      
      // 파일 맵 생성
      const map: Record<string, InMemoryFile> = {}
      for (const file of project.files) {
        map[file.name] = { name: file.name, content: file.content }
      }
      
      // localStorage와 sessionStorage에 저장
      const payload = JSON.stringify(map)
      localStorage.setItem('hotfixAI.files', payload)
      sessionStorage.setItem('hotfixAI.files', payload)
      sessionStorage.setItem('hotfixAI.projectId', projectId)
      
      router.push('/studio')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  // 프로젝트 생성
  function openCreateModal(type: 'ftp' | 'file' | 'folder') {
    setCreateModalType(type)
    if (type === 'ftp') {
      setShowFtpModal(true)
    } else if (type === 'file') {
      fileInputRef.current?.click()
    } else if (type === 'folder') {
      folderInputRef.current?.click()
    }
  }

  async function createProject(files: InMemoryFile[], sourceType: string, ftpInfo?: any) {
    try {
      setIsUploading(true)
      const projectName = ftpInfo?.host || `Project ${new Date().toLocaleString()}`
      
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: `${files.length} files`,
          sourceType,
          ftpHost: ftpInfo?.host,
          ftpPort: ftpInfo?.port,
          ftpPath: ftpInfo?.path,
          files
        })
      })

      if (!res.ok) throw new Error('프로젝트 생성 실패')
      
      const data = await res.json()
      const projectId = data.project.id

      // 파일 맵 생성
      const map: Record<string, InMemoryFile> = {}
      for (const f of files) {
        map[f.name] = { name: f.name, content: f.content }
      }
      const payload = JSON.stringify(map)
      localStorage.setItem('hotfixAI.files', payload)
      sessionStorage.setItem('hotfixAI.files', payload)
      sessionStorage.setItem('hotfixAI.projectId', projectId)
      
      router.push('/studio')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function persistAndGoToStudio(files: InMemoryFile[], sourceType: string = 'folder', ftpInfo?: any) {
    await createProject(files, sourceType, ftpInfo)
  }

  // --------- 폴더 트리 구성 유틸 ---------
  type TreeNode = { name: string; path: string; children?: TreeNode[]; isFile: boolean }

  function buildFolderTree(names: string[]): TreeNode {
    const root: TreeNode = { name: '', path: '', isFile: false, children: [] }
    for (const name of names) {
      const parts = name.split('/').filter(Boolean)
      let node = root
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isFile = i === parts.length - 1
        if (isFile) {
          node.children = node.children || []
          node.children.push({ name: part, path: node.path ? `${node.path}/${part}` : part, isFile: true })
        } else {
          node.children = node.children || []
          let child = node.children.find(c => !c.isFile && c.name === part)
          if (!child) {
            const newPath = node.path ? `${node.path}/${part}` : part
            child = { name: part, path: newPath, isFile: false, children: [] }
            node.children.push(child)
          }
          node = child
        }
      }
    }
    const sortNodes = (n: TreeNode) => {
      if (n.children) {
        n.children.sort((a, b) => {
          if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
          return a.name.localeCompare(b.name)
        })
        n.children.forEach(sortNodes)
      }
    }
    sortNodes(root)
    return root
  }

  function toggleExpand(path: string) {
    setExpandedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function toggleSelectFolder(path: string) {
    setSelectedFolders(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  function isFolderSelected(path: string) {
    return selectedFolders.has(path)
  }

  function countDescendants(node: TreeNode): number {
    if (!node.children || node.children.length === 0) return 0
    let count = 0
    for (const c of node.children) {
      if (c.isFile) count += 1
      else count += countDescendants(c)
    }
    return count
  }

  function renderTree(node: TreeNode, depth = 0): JSX.Element | null {
    if (!node.children || node.children.length === 0) return null
    return (
      <div>
        {node.children.map((child) => {
          if (child.isFile) {
            return (
              <div key={child.path} style={{ paddingLeft: depth * 16, display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', fontSize: 13 }}>
                <span>📄</span>
                <span>{child.name}</span>
              </div>
            )
          }
          const expanded = expandedFolders.has(child.path)
          const selected = isFolderSelected(child.path)
          return (
            <div key={child.path} style={{ paddingLeft: depth * 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" onClick={() => toggleExpand(child.path)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                  {expanded ? '▼' : '▶'}
                </button>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleSelectFolder(child.path)}
                  style={{ cursor: 'pointer' }}
                />
                <span>📁 {child.name}</span>
                <span style={{ marginLeft: 6, color: '#6b7280', fontSize: 12 }}>({countDescendants(child)} files)</span>
              </div>
              {expanded && renderTree(child, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    setIsUploading(true)
    setError(null)
    try {
      const results: InMemoryFile[] = []
      for (const file of Array.from(files)) {
        const text = await file.text()
        results.push({ name: file.name, content: text })
      }
      await persistAndGoToStudio(results, 'file')
    } catch (err) {
      setError('파일을 읽는 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  async function traverseEntry(entry: any, pathPrefix = ''): Promise<InMemoryFile[]> {
    const collected: InMemoryFile[] = []
    if (!entry) return collected
    if (entry.isFile) {
      const file: File = await new Promise((resolve, reject) => {
        entry.file((f: File) => resolve(f), reject)
      })
      const text = await file.text()
      collected.push({ name: pathPrefix ? `${pathPrefix}/${file.name}` : file.name, content: text })
    } else if (entry.isDirectory) {
      const reader = entry.createReader()
      const readAll = async () => {
        const batch: any[] = await new Promise((resolve, reject) => {
          reader.readEntries(resolve, reject)
        })
        if (batch.length === 0) return
        for (const ent of batch) {
          const child = await traverseEntry(ent, pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name)
          collected.push(...child)
        }
        await readAll()
      }
      await readAll()
    }
    return collected
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setIsUploading(true)
    setError(null)
    try {
      const items = e.dataTransfer.items
      const filesCollected: InMemoryFile[] = []
      if (items && items.length) {
        for (const item of Array.from(items)) {
          const entry = (item as any).webkitGetAsEntry ? (item as any).webkitGetAsEntry() : null
          if (entry) {
            const result = await traverseEntry(entry)
            filesCollected.push(...result)
          } else {
            const file = item.getAsFile && item.getAsFile()
            if (file) {
              const text = await file.text()
              filesCollected.push({ name: file.name, content: text })
            }
          }
        }
      } else if (e.dataTransfer.files && e.dataTransfer.files.length) {
        for (const file of Array.from(e.dataTransfer.files)) {
          const text = await file.text()
          filesCollected.push({ name: file.name, content: text })
        }
      }
      if (filesCollected.length === 0) {
        setError('드롭된 항목에서 읽을 수 있는 파일이 없습니다.')
        setIsUploading(false)
        return
      }
      await persistAndGoToStudio(filesCollected, 'folder')
    } catch {
      setError('드롭 처리 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleFtpConnect(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      setIsUploading(true)
      const res = await fetch('/api/ftp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: ftpHost,
          port: Number(ftpPort),
          username: ftpUser,
          password: ftpPassword,
          path: ftpPath,
          protocol: (ftpPort === '22' || ftpPort === '8010') ? 'sftp' : 'ftp'
        })
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setIsUploading(false)
        throw new Error(data?.error || 'FTP 연결 실패')
      }
      const files: InMemoryFile[] = (data.files || []).map((f: any) => ({ name: f.name, content: f.content }))
      if (!files.length) throw new Error('가져온 파일이 없습니다. 경로를 확인하세요.')

      if (files.length > 10) {
        setFetchedFiles(files)
        try {
          const names = files.map(f => f.name)
          const tree = buildFolderTree(names)
          const level1Folders = (tree.children || []).filter(n => !n.isFile).map(n => n.path)
          setExpandedFolders(new Set(level1Folders))
        } catch {}
        setShowSelectModal(true)
        setShowFtpModal(false)
        setIsUploading(false)
      } else {
        await persistAndGoToStudio(files, 'ftp', { host: ftpHost, port: Number(ftpPort), path: ftpPath })
        setIsUploading(false)
      }
    } catch (err: any) {
      setError(err?.message || 'FTP 연결 중 오류가 발생했습니다.')
      setIsUploading(false)
    }
  }

  // 프로젝트가 없을 때: 기존 UI
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f9ff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', border: '4px solid #c7d2fe', borderTopColor: '#3b82f6', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: 12, color: '#1f2937', fontWeight: 600 }}>프로젝트 불러오는 중...</div>
        </div>
      </div>
    )
  }

  const hasProjects = projects.length > 0

  return (
    <div style={{ minHeight: '100vh', background: '#f6f9ff' }}>
      {/* Hidden file inputs - 항상 렌더링 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".html,.css,.js,.htm,.txt"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <input
        ref={folderInputRef}
        type="file"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        {...({ webkitdirectory: '', directory: '' } as any)}
      />
      
      {/* 상단 네비게이션 */}
      <Header />

      <div style={{
        minHeight: 'calc(100vh - 160px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 40px'
      }}>
        {!hasProjects ? (
          /* 프로젝트가 없을 때: 큰 버튼들 */
          <main
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            style={{
              maxWidth: 1000,
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20
            }}>
            <button
              onClick={() => openCreateModal('ftp')}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 24,
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: isDragging ? 'none' : '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiServer color="#1d4ed8" size={20} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>FTP 연결하기</div>
              </div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>서버에서 사이트 파일을 불러옵니다.</div>
            </button>

            <button
              onClick={() => openCreateModal('file')}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 24,
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: isDragging ? 'none' : '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFilePlus color="#1d4ed8" size={20} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>파일 선택하기</div>
              </div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>HTML/CSS/JS 파일을 올립니다.</div>
            </button>

            <button
              onClick={() => openCreateModal('folder')}
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: 24,
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: isDragging ? 'none' : '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFolder color="#1d4ed8" size={20} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>폴더 선택하기</div>
              </div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>프로젝트 폴더를 통째로 업로드합니다.</div>
            </button>

            {error && (
              <div style={{ gridColumn: '1 / -1', color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: 12 }}>
                {error}
              </div>
            )}
          </main>
        ) : (
          /* 프로젝트가 있을 때: 카드 리스트 */
          <main style={{ maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {/* 플러스 카드 */}
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'white',
                  border: '2px dashed #cbd5e1',
                  borderRadius: 16,
                  padding: 24,
                  minHeight: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  gap: 12
                }}
              >
                <FiPlus size={32} color="#94a3b8" />
                <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>새 프로젝트</div>
              </button>

              {/* 프로젝트 카드들 */}
              {projects.map(project => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project.id)}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: 24,
                    minHeight: 160,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
                      {project.name}
                    </div>
                    {project.description && (
                      <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
                        {project.description}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                      {project._count.files} files
                    </div>
                    <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        )}
      </div>

      {/* 모달: 프로젝트 생성 방법 선택 */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}
             onClick={() => setShowCreateModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 520,
              background: 'white',
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              padding: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>프로젝트 생성</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0, marginBottom: 16 }}>
              프로젝트를 어떻게 만들까요?
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <button
                onClick={() => { 
                  setShowCreateModal(false)
                  // Input이 항상 DOM에 있으므로 바로 실행 가능
                  setTimeout(() => openCreateModal('ftp'), 50)
                }}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiServer color="#1d4ed8" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>FTP로 연결</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>서버에서 파일 불러오기</div>
                </div>
              </button>
              <button
                onClick={() => { 
                  setShowCreateModal(false)
                  // Input이 항상 DOM에 있으므로 바로 실행 가능
                  setTimeout(() => openCreateModal('file'), 50)
                }}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFilePlus color="#1d4ed8" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>파일 선택</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>로컬 파일 업로드</div>
                </div>
              </button>
              <button
                onClick={() => { 
                  setShowCreateModal(false)
                  // Input이 항상 DOM에 있으므로 바로 실행 가능
                  setTimeout(() => openCreateModal('folder'), 50)
                }}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiFolder color="#1d4ed8" size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>폴더 선택</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>폴더 통째로 업로드</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FTP 모달 */}
      {showFtpModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200
        }}
             onClick={() => setShowFtpModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 520,
              background: 'white',
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              padding: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>FTP 연결</h3>
              <button onClick={() => setShowFtpModal(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0, marginBottom: 16 }}>
              자격 증명을 입력하면 파일을 불러옵니다. (SFTP는 포트 22 또는 8010)
            </p>
            <form onSubmit={handleFtpConnect} style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#374151' }}>호스트</label>
                <input value={ftpHost} onChange={e => setFtpHost(e.target.value)} placeholder="예: ecimg-ftp-c01.cafe24img.com"
                       style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>사용자</label>
                  <input value={ftpUser} onChange={e => setFtpUser(e.target.value)} placeholder="계정명"
                         style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>비밀번호</label>
                  <input value={ftpPassword} onChange={e => setFtpPassword(e.target.value)} placeholder="비밀번호" type="password"
                         style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>경로</label>
                  <input value={ftpPath} onChange={e => setFtpPath(e.target.value)} placeholder="예: / 또는 /public_html"
                         style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <label style={{ fontSize: 13, color: '#374151' }}>포트</label>
                  <input value={ftpPort} onChange={e => setFtpPort(e.target.value)} placeholder="FTP 21 / SFTP 22 또는 8010"
                         style={{ padding: '12px 14px', border: '1px solid #e5e7eb', borderRadius: 10 }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowFtpModal(false)}
                        style={{ background: 'white', color: '#111827', border: '1px solid #e5e7eb', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}>
                  취소
                </button>
                <button type="submit"
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>
                  연결
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 폴더 선택 모달 */}
      {showSelectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210
        }}
             onClick={() => { setShowSelectModal(false); setFetchedFiles(null); setSelectedFolders(new Set()); }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 720,
              maxHeight: '80vh',
              overflow: 'auto',
              background: 'white',
              borderRadius: 14,
              border: '1px solid #e5e7eb',
              boxShadow: '0 10px 24px rgba(0,0,0,0.12)',
              padding: 24
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827' }}>가져올 폴더 선택</h3>
              <button onClick={() => { setShowSelectModal(false); setFetchedFiles(null); setSelectedFolders(new Set()); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <p style={{ color: '#6b7280', fontSize: 14, marginTop: 0, marginBottom: 12 }}>
              파일이 많아 폴더 단위로 선택하세요. 체크된 폴더 하위의 파일만 불러옵니다.
            </p>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 12 }}>
              {(() => {
                const names = (fetchedFiles || []).map(f => f.name)
                const tree = buildFolderTree(names)
                return renderTree(tree)
              })()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <div style={{ color: '#6b7280', fontSize: 13 }}>
                선택된 폴더: {selectedFolders.size}개
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setSelectedFolders(new Set()); }}
                  style={{ background: 'white', color: '#111827', border: '1px solid #e5e7eb', padding: '10px 14px', borderRadius: 10, cursor: 'pointer' }}
                >
                  선택 해제
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!fetchedFiles) return
                    if (selectedFolders.size === 0) {
                      setError('최소 한 개의 폴더를 선택해 주세요.')
                      return
                    }
                    setIsUploading(true)
                    const prefixes = Array.from(selectedFolders).map(p => p.endsWith('/') ? p : p + '/')
                    const filtered = fetchedFiles.filter(f =>
                      prefixes.some(pref => f.name.startsWith(pref)) ||
                      selectedFolders.has(f.name)
                    )
                    setShowSelectModal(false)
                    setFetchedFiles(null)
                    setSelectedFolders(new Set())
                    await persistAndGoToStudio(filtered, 'ftp', { host: ftpHost, port: Number(ftpPort), path: ftpPath })
                    setIsUploading(false)
                  }}
                  style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 전역 로딩 오버레이 */}
      {isUploading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255,255,255,0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              border: '4px solid #c7d2fe', borderTopColor: '#3b82f6',
              animation: 'spin 1s linear infinite'
            }} />
            <div style={{ color: '#1f2937', fontWeight: 600 }}>불러오는 중...</div>
          </div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}
