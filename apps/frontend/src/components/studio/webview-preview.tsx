'use client'

import { useState, useEffect } from 'react'

interface WebviewPreviewProps {
  src: string
}

export default function WebviewPreview({ src }: WebviewPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    setError(null)

    // iframe 로딩 시뮬레이션
    const timer = setTimeout(() => {
      if (src) {
        setIsLoading(false)
      } else {
        setError('미리보기를 생성할 수 없습니다.')
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [src])

  return (
    <div className="preview-container">
      {/* Header */}
      <div className="preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '18px' }}>🖼️</div>
          <h3 className="preview-title">라이브 미리보기</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isLoading && !error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--color-text-muted)',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              <span>실시간 동기화</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Frame */}
      <div className="preview-frame-wrapper">
        {isLoading && (
          <div className="preview-loading">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  border: '3px solid var(--color-gray-200)',
                  borderTop: '3px solid var(--color-primary-600)',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div>미리보기 로딩 중...</div>
            </div>
          </div>
        )}

        {error && (
          <div className="preview-loading">
            <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
              <div>{error}</div>
            </div>
          </div>
        )}

        {!isLoading && !error && src && (
          <iframe
            className="preview-frame"
            src={src}
            sandbox="allow-scripts allow-same-origin"
            title="Preview"
          />
        )}

        {!isLoading && !error && !src && (
          <div className="preview-loading">
            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <div>파일을 업로드하면 미리보기가 표시됩니다</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
