/**
 * 선택된 HTML 요소의 정보를 담는 타입
 */
export interface SelectedElement {
  /** 요소의 CSS 셀렉터 */
  selector: string
  /** 요소의 태그명 (예: 'div', 'button', 'span') */
  tagName: string
  /** 요소의 ID (있는 경우) */
  id?: string
  /** 요소의 클래스명 목록 */
  classNames?: string[]
  /** 요소의 텍스트 내용 */
  textContent?: string
  /** 요소가 위치한 파일명 */
  sourceFile?: string
  /** 요소의 위치 정보 (optional) */
  position?: {
    x: number
    y: number
    width: number
    height: number
  }
}

