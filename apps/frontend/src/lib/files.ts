// 파일 관리 유틸리티

export interface FileData {
  name: string
  content: string
  type?: string
}

/**
 * localStorage에서 업로드된 파일을 불러오거나, 없으면 데모 파일 반환
 */
export function loadInitialFiles(): Record<string, string> {
  if (typeof window === 'undefined') return {}

  // 우선 새 키('hotfixAI.files')를 확인하고, 없으면 구 키('uploadedFiles')를 호환 처리
  const storedNew = localStorage.getItem('hotfixAI.files') || sessionStorage.getItem('hotfixAI.files')
  const storedLegacy = localStorage.getItem('uploadedFiles') || sessionStorage.getItem('uploadedFiles')
  const stored = storedNew ?? storedLegacy

  try {
    console.log('[CLIENT][Files] loadInitialFiles - storage keys', {
      hasHotfixNew: !!storedNew,
      hasLegacy: !!storedLegacy
    })
  } catch {}
  
  if (stored) {
    try {
      // 새 포맷: { [name]: { name, content } } (StartPage에서 저장)
      // 구 포맷: FileData[]
      const parsed = JSON.parse(stored)
      const fileMap: Record<string, string> = {}

      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // 새 포맷
        for (const [name, obj] of Object.entries(parsed as Record<string, any>)) {
          const content = (obj as any)?.content
          if (typeof content === 'string') {
            fileMap[name] = content
          }
        }
      } else if (Array.isArray(parsed)) {
        // 구 포맷
        (parsed as FileData[]).forEach((file) => {
          fileMap[file.name] = file.content
        })
      }

       try {
        console.log('[CLIENT][Files] Loaded from storage', { count: Object.keys(fileMap).length })
       } catch {}
      return fileMap
    } catch (e) {
      console.error('Failed to load uploaded files:', e)
    }
  }

  // 더 이상 데모(임시) 파일을 자동으로 불러오지 않음
  return {}
}

/**
 * 데모 파일 생성 (아름다운 랜딩 페이지)
 */
export function getDemoFiles(): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HotfixAI Demo</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <div class="logo">
                <div class="logo-icon"></div>
                <h1>HotfixAI</h1>
            </div>
            <nav class="nav">
                <a href="#features">기능</a>
                <a href="#demo">데모</a>
                <a href="#pricing">가격</a>
            </nav>
        </header>

        <section class="hero">
            <h2 class="hero-title">AI와 함께하는 실시간 코드 편집</h2>
            <p class="hero-subtitle">
                HTML, CSS, JavaScript 파일을 업로드하고<br>
                대화하며 즉시 수정하세요
            </p>
            <div class="hero-buttons">
                <button class="btn btn-primary">시작하기</button>
                <button class="btn btn-secondary">더 알아보기</button>
            </div>
        </section>

        <section class="features" id="features">
            <div class="feature-card">
                <div class="feature-icon">🎨</div>
                <h3>실시간 미리보기</h3>
                <p>코드 변경사항을 즉시 확인하세요</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💬</div>
                <h3>AI 어시스턴트</h3>
                <p>자연어로 코드 수정 요청하기</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3>빠른 프로토타이핑</h3>
                <p>아이디어를 빠르게 구현하세요</p>
            </div>
        </section>

        <footer class="footer">
            <p>&copy; 2024 HotfixAI. All rights reserved.</p>
        </footer>
    </div>

    <script src="app.js"></script>
</body>
</html>`,

    'styles.css': `/* Reset & Base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Header */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    margin-bottom: 60px;
}

.logo {
    display: flex;
    align-items: center;
    gap: 12px;
}

.logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logo h1 {
    font-size: 24px;
    font-weight: 700;
    color: white;
}

.nav {
    display: flex;
    gap: 30px;
}

.nav a {
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
}

.nav a:hover {
    opacity: 0.8;
}

/* Hero Section */
.hero {
    text-align: center;
    padding: 80px 20px;
    color: white;
}

.hero-title {
    font-size: 56px;
    font-weight: 800;
    margin-bottom: 20px;
    line-height: 1.2;
}

.hero-subtitle {
    font-size: 20px;
    margin-bottom: 40px;
    opacity: 0.9;
}

.hero-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
}

/* Buttons */
.btn {
    padding: 14px 32px;
    font-size: 16px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-primary {
    background: white;
    color: #667eea;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid white;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Features */
.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin: 60px 0;
}

.feature-card {
    background: white;
    padding: 40px;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
}

.feature-card:hover {
    transform: translateY(-5px);
}

.feature-icon {
    font-size: 48px;
    margin-bottom: 20px;
}

.feature-card h3 {
    font-size: 24px;
    margin-bottom: 12px;
    color: #1f2937;
}

.feature-card p {
    color: #6b7280;
    line-height: 1.6;
}

/* Footer */
.footer {
    text-align: center;
    padding: 40px 0;
    color: white;
    opacity: 0.8;
    margin-top: 60px;
}

/* Animations */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.hero {
    animation: fadeIn 0.8s ease;
}

.feature-card {
    animation: fadeIn 1s ease;
}

.feature-card:nth-child(2) {
    animation-delay: 0.1s;
}

.feature-card:nth-child(3) {
    animation-delay: 0.2s;
}`,

    'app.js': `// 간단한 인터랙션 추가
document.addEventListener('DOMContentLoaded', () => {
    console.log('✨ HotfixAI Demo Loaded!');

    // 버튼 클릭 이벤트
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const btnText = e.target.textContent;
            console.log(\`버튼 클릭됨: \${btnText}\`);
            
            // 간단한 피드백
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 100);
        });
    });

    // 스무스 스크롤
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Feature 카드 호버 효과
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
    });
});`
  }
}

/**
 * 파일 맵을 기반으로 미리보기 URL 생성
 */
export function pickDefaultHtmlFile(fileMap: Record<string, string>): string | '' {
  const has = (n: string) => Object.prototype.hasOwnProperty.call(fileMap, n)
  if (has('index.html')) return 'index.html'
  if (has('index.htm')) return 'index.htm'
  const htmls = Object.keys(fileMap).filter(n => n.toLowerCase().endsWith('.html') || n.toLowerCase().endsWith('.htm'))
  htmls.sort()
  return htmls[0] || ''
}

/**
 * 선택된 HTML(entry) 기준으로 미리보기 URL 생성. entry가 없으면 기본 HTML을 선택.
 */
export function generatePreviewUrl(fileMap: Record<string, string>, entry?: string): string {
  if (typeof window === 'undefined') return ''

  const chosen = entry && fileMap[entry] ? entry : pickDefaultHtmlFile(fileMap)
  if (!chosen) return ''
  let html = fileMap[chosen]

  // HTML 내의 상대 경로를 blob URL로 치환
  let processedHtml = html

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const toBlobUrl = (content: string, type: string) => URL.createObjectURL(new Blob([content], { type }))
  const dirname = (p: string) => {
    const idx = p.lastIndexOf('/')
    return idx === -1 ? '' : p.slice(0, idx)
  }
  const stripLeadingSlash = (p: string) => p.replace(/^\/+/, '')
  const readFile = (p: string) => {
    const k = stripLeadingSlash(p)
    return fileMap[k]
  }
  const stripCafe24Vars = (s: string) => s.replace(/\{\$[^}]+\}/g, '')
  const normalizePath = (p: string) => {
    const parts = p.split('/')
    const stack: string[] = []
    for (const part of parts) {
      if (!part || part === '.') continue
      if (part === '..') stack.pop()
      else stack.push(part)
    }
    return stack.join('/')
  }
  const resolveAssetPath = (entryDir: string, href: string): string | null => {
    const raw = href.trim()
    if (!raw) return null
    if (/^(https?:)?\/\//i.test(raw)) return null
    if (/^data:/i.test(raw)) return null
    // remove query/hash
    const clean = raw.replace(/[?#].*$/, '')
    let candidate = ''
    if (clean.startsWith('/')) {
      candidate = stripLeadingSlash(clean)
    } else {
      candidate = normalizePath((entryDir ? entryDir + '/' : '') + clean)
    }
    if (fileMap[candidate]) return candidate
    // try direct without leading slash
    const direct = stripLeadingSlash(clean)
    if (fileMap[direct]) return direct
    // suffix match (best-effort): pick the longest matching key that endsWith candidate
    let best: string | null = null
    for (const key of Object.keys(fileMap)) {
      if (key.toLowerCase().endsWith(candidate.toLowerCase()) || key.toLowerCase().endsWith(direct.toLowerCase())) {
        if (!best || key.length > best.length) best = key
      }
    }
    return best
  }

  // Cafe24 템플릿 지시문 전처리: @css, @import, @layout
  try {
    // <!--@css(/css/xxx.css)--> → <link rel="stylesheet" href="/css/xxx.css" />
    processedHtml = processedHtml.replace(/<!--\s*@css\(([^)]+)\)\s*-->/gi, (_m, p1) => {
      const href = String(p1).trim()
      return `<link rel="stylesheet" href="${href}" />`
    })
    // <!--@import(/path/file.html)--> → 파일 내용 인라인(있으면), 없으면 그대로 둠
    processedHtml = processedHtml.replace(/<!--\s*@import\(([^)]+)\)\s*-->/gi, (_m, p1) => {
      const path = String(p1).trim()
      const content = readFile(path)
      return typeof content === 'string' ? content : _m
    })
    // <!--@layout(/layout/main.html)--> → 레이아웃 내용 선두 삽입(있으면)
    processedHtml = processedHtml.replace(/<!--\s*@layout\(([^)]+)\)\s*-->/gi, (_m, p1) => {
      const path = String(p1).trim()
      const content = readFile(path)
      return typeof content === 'string' ? content : ''
    })
  } catch {}

  const getRelativePath = (fromDir: string, toPath: string) => {
    if (!fromDir) return toPath
    const fromParts = fromDir.split('/').filter(Boolean)
    const toParts = toPath.split('/').filter(Boolean)
    let i = 0
    while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) i++
    const up = fromParts.length - i
    const down = toParts.slice(i).join('/')
    return `${up ? '../'.repeat(up) : ''}${down}` || './'
  }
  const entryDir = dirname(chosen)

  // Pass 1: <link ... href="...css">를 개별 분석/치환
  processedHtml = processedHtml.replace(/<link\b([^>]*?)href=["']([^"']+\.css[^"']*)["']([^>]*)>/gi, (_m, pre, href, post) => {
    const key = resolveAssetPath(entryDir, href)
    if (key && typeof fileMap[key] === 'string') {
      const cssUrl = toBlobUrl(stripCafe24Vars(fileMap[key]), 'text/css')
      return `<link${pre}href="${cssUrl}"${post}>`
    }
    return _m
  })

  // Pass 2: <script ... src="...js">를 개별 분석/치환
  processedHtml = processedHtml.replace(/<script\b([^>]*?)src=["']([^"']+\.js[^"']*)["']([^>]*)>\s*<\/script>/gi, (_m, pre, src, post) => {
    const key = resolveAssetPath(entryDir, src)
    if (key && typeof fileMap[key] === 'string') {
      const jsUrl = toBlobUrl(fileMap[key], 'text/javascript')
      return `<script${pre}src="${jsUrl}"${post}></script>`
    }
    return _m
  })

  // Pass 3: 불러온 모든 파일 중 css/js를 자동 주입 (중복은 제외)
  try {
    // 이미 포함된 href/src 수집
    const included = new Set<string>()
    const hrefRe = /<link\b[^>]*?href=["']([^"']+)["'][^>]*>/gi
    const srcRe = /<script\b[^>]*?src=["']([^"']+)["'][^>]*>\s*<\/script>/gi
    let m: RegExpExecArray | null
    while ((m = hrefRe.exec(processedHtml))) included.add(m[1])
    while ((m = srcRe.exec(processedHtml))) included.add(m[1])

    const autoCss: string[] = []
    const autoJs: string[] = []
    for (const key of Object.keys(fileMap)) {
      const isCss = key.toLowerCase().endsWith('.css')
      const isJs = key.toLowerCase().endsWith('.js')
      if (!isCss && !isJs) continue

      // 이미 포함된 경로로 해석되는지 체크
      const rel = entryDir ? getRelativePath(entryDir, key) : key
      const relDot = rel.startsWith('../') || rel.startsWith('./') ? rel : './' + rel
      const candidates = [key, '/' + key, rel, relDot]
      const already = candidates.some(c => included.has(c))
      if (already) continue

      if (isCss) autoCss.push(key)
      else autoJs.push(key)
    }

    // 안정적인 로딩을 위해 경로 이름순으로 정렬
    autoCss.sort()
    autoJs.sort()

    // 태그 문자열 생성
    const cssTags = autoCss.map(k => {
      const url = toBlobUrl(stripCafe24Vars(fileMap[k]), 'text/css')
      return `<link rel="stylesheet" href="${url}" data-auto="true">`
    }).join('\n')

    const jsTags = autoJs.map(k => {
      const url = toBlobUrl(fileMap[k], 'text/javascript')
      return `<script src="${url}" data-auto="true"></script>`
    }).join('\n')

    if (cssTags) {
      if (/<\/head>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<\/head>/i, `${cssTags}\n</head>`)
      } else {
        // head가 없으면 body 앞에 삽입
        processedHtml = `${cssTags}\n${processedHtml}`
      }
    }
    if (jsTags) {
      if (/<\/body>/i.test(processedHtml)) {
        processedHtml = processedHtml.replace(/<\/body>/i, `${jsTags}\n</body>`)
      } else {
        processedHtml = `${processedHtml}\n${jsTags}`
      }
    }
  } catch {}

  // 마지막으로 HTML 내 남은 Cafe24 변수 표기 제거 (프리뷰 가독성)
  try {
    processedHtml = stripCafe24Vars(processedHtml)
  } catch {}

  // 엘리먼트 선택 스크립트 주입
  const elementSelectorScript = `
<script>
(function() {
  if (window.elementSelectorInjected) return;
  window.elementSelectorInjected = true;

  // 하이라이트 오버레이 생성
  const overlay = document.createElement('div');
  overlay.id = 'element-selector-overlay';
  overlay.style.cssText = \`
    position: absolute;
    pointer-events: none;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    z-index: 999999;
    display: none;
  \`;
  document.body.appendChild(overlay);

  // 현재 호버된 요소 추적
  let currentHoverElement = null;

  // CSS 셀렉터 생성
  function getElementSelector(element) {
    if (element.id) return '#' + element.id;
    
    const path = [];
    let current = element;
    
    while (current && current.tagName !== 'BODY') {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = Array.from(current.classList).filter(c => c && !c.startsWith('_'));
        if (classes.length > 0) {
          selector += '.' + classes.join('.');
        }
      }
      
      if (current.parentElement) {
        const siblings = Array.from(current.parentElement.children).filter(
          child => child.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += ':nth-of-type(' + index + ')';
        }
      }
      
      path.unshift(selector);
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  // 줄 번호 추정
  function estimateLineNumber(element) {
    let depth = 0;
    let current = element;
    
    while (current && current !== document.body && current !== document.documentElement) {
      depth++;
      current = current.parentElement;
    }
    
    return 10 + depth * 2;
  }

  // 오버레이 위치 업데이트 함수
  function updateOverlayPosition() {
    if (!currentHoverElement) {
      overlay.style.display = 'none';
      return;
    }
    
    const rect = currentHoverElement.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = (rect.left + window.scrollX) + 'px';
    overlay.style.top = (rect.top + window.scrollY) + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';
  }

  // 마우스 오버 이벤트
  document.addEventListener('mouseover', function(e) {
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement || target.id === 'element-selector-overlay') {
      currentHoverElement = null;
      overlay.style.display = 'none';
      return;
    }
    
    currentHoverElement = target;
    updateOverlayPosition();
  });

  // 스크롤 이벤트 - 오버레이 위치 업데이트
  document.addEventListener('scroll', updateOverlayPosition, true);

  // 클릭 이벤트
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (!target || target === document.body || target === document.documentElement || target.id === 'element-selector-overlay') {
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = target.getBoundingClientRect();
    const selector = getElementSelector(target);
    const approximateLine = estimateLineNumber(target);
    
    const elementInfo = {
      selector: selector,
      tagName: target.tagName.toLowerCase(),
      id: target.id || undefined,
      classNames: target.className ? Array.from(target.classList) : undefined,
      className: target.className || undefined,
      textContent: target.textContent ? target.textContent.trim().substring(0, 100) : undefined,
      innerText: target.innerText ? target.innerText.trim().substring(0, 100) : undefined,
      outerHTML: target.outerHTML ? target.outerHTML.substring(0, 500) : undefined,
      approximateLine: approximateLine,
      position: {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      }
    };
    
    // parent window로 메시지 전송
    window.parent.postMessage({ type: 'ELEMENT_SELECTED', data: elementInfo }, '*');
    
    // 선택 표시 (애니메이션 개선)
    const rect2 = target.getBoundingClientRect();
    overlay.style.left = (rect2.left + window.scrollX) + 'px';
    overlay.style.top = (rect2.top + window.scrollY) + 'px';
    overlay.style.borderColor = '#10b981';
    overlay.style.background = 'rgba(16, 185, 129, 0.15)';
    setTimeout(function() {
      overlay.style.borderColor = '#3b82f6';
      overlay.style.background = 'rgba(59, 130, 246, 0.1)';
    }, 500);
  }, true);

  // 리사이즈 이벤트 - 오버레이 위치 업데이트
  window.addEventListener('resize', updateOverlayPosition);
})();
</script>
`;

  // </body> 태그 직전에 스크립트 삽입
  if (/<\/body>/i.test(processedHtml)) {
    processedHtml = processedHtml.replace(/<\/body>/i, `${elementSelectorScript}\n</body>`)
  } else {
    // body 태그가 없으면 맨 끝에 추가
    processedHtml = `${processedHtml}\n${elementSelectorScript}`
  }

  // 최종 HTML blob URL 생성
  const htmlBlob = new Blob([processedHtml], { type: 'text/html' })
  return URL.createObjectURL(htmlBlob)
}
