# Schedule Ninja Design Guide

> UI/UX 디자인 시스템 및 컴포넌트 가이드

---

## 🎨 Color Palette

### Light Mode

| Token | Color | Usage |
|-------|-------|-------|
| `--modal-bg` | `#313B43` | Modal 배경, 어두운 청회색 |
| `--header-bg` | `#343A40` | 헤더 배경, 다크 그레이 |
| `--body-bg` | `#F8F9FA` | 본문 배경, 라이트 그레이 |
| `--card-bg` | `#F6F6F6` | 카드 배경 |
| `--text-primary` | `#2C3E50` | 기본 텍스트, 다크 블루 |
| `--text-secondary` | `#6c757d` | 보조 텍스트 |
| `--accent` | `#E83941` | 포인트 컬러, 닌자 레드 |
| `--accent-hover` | `#d63031` | 액센트 호버 상태 |

### Dark Mode

| Token | Color | Usage |
|-------|-------|-------|
| `--modal-bg` | `#22272e` | Modal 배경 |
| `--header-bg` | `#2d333b` | 헤더 배경 |
| `--body-bg` | `#1c2128` | 본문 배경 |
| `--card-bg` | `rgba(255,255,255,0.03)` | 카드 배경 |
| `--text-primary` | `#e6edf3` | 기본 텍스트 |
| `--text-secondary` | `#768390` | 보조 텍스트 |
| `--accent` | `#ff6b6b` | 포인트 컬러 |
| `--accent-hover` | `#ff5252` | 액센트 호버 상태 |

---

## 📐 Design Principles

1. **카드 기반 레이아웃**: 헤더(다크) + 본문(라이트) 구조
2. **둥근 모서리**: 친근하고 모던한 느낌
3. **미니멀 디자인**: 불필요한 요소 제거, 정보 계층 명확화
4. **닌자 테마**: 아이콘 및 브랜딩에 닌자 모티프 사용
5. **접근성**: 충분한 색상 대비, 키보드 네비게이션 지원

---

## 🔧 Component Specifications

### Modal

```css
/* 크기 */
width: 400px;
max-height: 600px;
overflow-y: auto;

/* 위치 */
position: fixed;
top: 20px;
right: 20px;
z-index: 99999;

/* 애니메이션 */
animation: slideInFromRight 0.3s ease-out;
```

### Cards

```css
/* 이벤트 카드 */
background: var(--card-bg);
border-radius: 12px;
padding: 16px;
margin-bottom: 12px;

/* 호버 효과 */
transition: box-shadow 0.2s ease;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);
```

### Buttons

| Type | Style |
|------|-------|
| Primary | `bg: var(--accent)`, `color: white`, `hover: var(--accent-hover)` |
| Secondary | `bg: transparent`, `border: 1px solid var(--text-secondary)` |
| Icon | `size: 32px`, `border-radius: 50%`, `hover: bg opacity change` |

```css
/* 버튼 공통 */
border-radius: 8px;
padding: 10px 16px;
font-weight: 600;
transition: all 0.2s ease;
cursor: pointer;
```

### Inputs

```css
/* 텍스트 입력 */
border: 1px solid var(--border-color);
border-radius: 6px;
padding: 8px 12px;
font-size: 14px;

/* 포커스 */
outline: none;
border-color: var(--accent);
box-shadow: 0 0 0 3px rgba(232, 57, 65, 0.1);
```

---

## 🎭 Icons & Assets

### Icon Set

- **확장 아이콘**: `icons/icon-16.png`, `icon-48.png`, `icon-128.png`
- **닌자 로고**: `ninja-icon.svg` (메인 브랜딩)
- **UI 아이콘**: 캘린더, 시계, 위치 핀, 체크마크

### Animation Assets

- `assets/` 폴더에 로딩/성공 애니메이션 저장
- GIF 또는 CSS 애니메이션 사용

---

## 📱 Responsive Behavior

### Modal Responsive

```css
/* 기본 */
@media (min-width: 768px) {
  width: 400px;
}

/* 작은 화면 */
@media (max-width: 767px) {
  width: calc(100vw - 40px);
  max-width: 400px;
}
```

---

## ✨ Animations

### Slide In (Modal 진입)

```css
@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### Card Expand

```css
.card-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-content.expanded {
  max-height: 500px;
}
```

### Progress Bar

```css
.progress-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--accent), var(--accent-hover));
  border-radius: 2px;
  transition: width 0.3s ease;
}
```

---

## 📝 Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
             'Helvetica Neue', Arial, sans-serif;
```

### Scale

| Element | Size | Weight |
|---------|------|--------|
| Modal Title | 18px | 700 |
| Card Title | 16px | 600 |
| Body Text | 14px | 400 |
| Caption | 12px | 400 |
| Button | 14px | 600 |

---

## 📏 Spacing

| Token | Value |
|-------|-------|
| `--space-xs` | 4px |
| `--space-sm` | 8px |
| `--space-md` | 12px |
| `--space-lg` | 16px |
| `--space-xl` | 24px |

---

## 🔲 Border Radius

| Element | Radius |
|---------|--------|
| Modal | 16px |
| Card | 12px |
| Button | 8px |
| Input | 6px |
| Icon Button | 50% (원형) |

---

## 💡 UX Guidelines

### Toast Notifications

| Type | Duration | Color |
|------|----------|-------|
| Success | 3s | Green (`#28a745`) |
| Error | 5s | Red (`var(--accent)`) |
| Info | 5s | Blue (`#17a2b8`) |
| Warning | 5s | Orange (`#ffc107`) |

### Loading States

1. **Skeleton**: 카드 로딩 시 placeholder 표시
2. **Progress Bar**: AI 처리 중 단계별 진행률 표시
   - `cache_check` → `downloading` → `parsing` → `processing` → `complete`
3. **Spinner**: 버튼 내 로딩 인디케이터

### Empty States

- 이벤트 없음: 친절한 메시지 + 재시도 버튼
- 오류 발생: 구체적인 오류 메시지 + 해결 방법 안내

---

## 🌙 Theme Implementation

```javascript
// content.js COLOR_PALETTE 객체
const COLOR_PALETTE = {
  light: {
    modalBg: '#313B43',
    headerBg: '#343A40',
    bodyBg: '#F8F9FA',
    // ...
  },
  dark: {
    modalBg: '#22272e',
    headerBg: '#2d333b',
    bodyBg: '#1c2128',
    // ...
  }
};
```

### Theme Switching

- `chrome.storage.sync`에서 `darkMode` 값 읽기
- 시스템 preference: `prefers-color-scheme` 미디어 쿼리 폴백
- 실시간 전환: CSS 변수 업데이트로 즉시 반영
