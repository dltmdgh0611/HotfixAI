'use client'

import { useMemo, useState, useEffect } from 'react'

interface FileTreeProps {
  files: string[]
  selectedFile: string
  onFileSelect: (filename: string) => void
}

type TreeNode = {
  name: string
  path: string
  isFile: boolean
  children?: TreeNode[]
}

export default function FileTree({
  files,
  selectedFile,
  onFileSelect,
}: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    // 초기 1단계 폴더 자동 확장
    const level1 = new Set<string>()
    for (const f of files) {
      const p = f.split('/').filter(Boolean)
      if (p.length > 1) {
        level1.add(p[0])
      }
    }
    setExpanded(new Set(Array.from(level1)))
  }, [files])

  const tree = useMemo(() => {
    const root: TreeNode = { name: '', path: '', isFile: false, children: [] }
    for (const name of files) {
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
      if (!n.children) return
      n.children.sort((a, b) => {
        if (a.isFile !== b.isFile) return a.isFile ? 1 : -1
        return a.name.localeCompare(b.name)
      })
      n.children.forEach(sortNodes)
    }
    sortNodes(root)
    return root
  }, [files])

  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'html':
      case 'htm':
        return '📄'
      case 'css':
        return '🎨'
      case 'js':
      case 'jsx':
        return '⚡'
      case 'ts':
      case 'tsx':
        return '📘'
      case 'json':
        return '📋'
      default:
        return '📄'
    }
  }

  const getFileExtension = (filename: string): string => {
    return filename.split('.').pop()?.toUpperCase() || 'FILE'
  }

  const render = (node: TreeNode, depth = 0): JSX.Element | null => {
    if (!node.children || node.children.length === 0) return null
    return (
      <ul className="file-tree-list" style={{ marginLeft: depth ? 0 : 0 }}>
        {node.children.map((child) => {
          if (child.isFile) {
            const active = selectedFile === child.path
            return (
              <li
                key={child.path}
                className={`file-tree-item ${active ? 'active' : ''}`}
                onClick={() => onFileSelect(child.path)}
                style={{ paddingLeft: depth * 14 }}
              >
                <span className="file-icon">{getFileIcon(child.path)}</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{child.name}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: 'var(--color-text-muted)',
                    backgroundColor: 'var(--color-gray-100)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {getFileExtension(child.path)}
                </span>
              </li>
            )
          }
          const isOpen = expanded.has(child.path)
          return (
            <li key={child.path} style={{ paddingLeft: depth * 14 }}>
              <div
                className="file-tree-item"
                onClick={() => {
                  const next = new Set(expanded)
                  if (isOpen) next.delete(child.path)
                  else next.add(child.path)
                  setExpanded(next)
                }}
              >
                <span style={{ width: 16 }}>{isOpen ? '▼' : '▶'}</span>
                <span className="file-icon">📁</span>
                <span style={{ flex: 1, fontSize: '14px' }}>{child.name}</span>
              </div>
              {isOpen && render(child, depth + 1)}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="file-tree">
      {/* Header */}
      <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>파일 탐색기</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          {files.length}개 파일
        </p>
      </div>

      {/* Tree */}
      {files.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 16px',
            color: 'var(--color-text-muted)',
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📁</div>
          <div style={{ fontSize: '14px' }}>파일이 없습니다</div>
        </div>
      ) : (
        render(tree)
      )}

      {/* Footer Info */}
      {files.length > 0 && (
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: 'var(--color-gray-50)',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '6px' }}>💡 팁</div>
          <div>HTML 파일을 클릭하면 미리보기가 갱신됩니다.</div>
        </div>
      )}
    </div>
  )
}
