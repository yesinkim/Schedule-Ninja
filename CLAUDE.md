# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Schedule Ninja** is a Chrome Extension (MV3) that uses Chrome's on-device AI (Gemini Nano via LanguageModel API) to extract event information from web pages and save it directly to Google Calendar. The extension emphasizes privacy (100% on-device processing), speed, and a seamless user experience.

## IMPORTANT: Python Environment Rules

**NEVER install packages to global/base Python!**

### Backend 환경: uv 사용 (권장)

```bash
cd /Users/yesinkim/Bailando/01_Lab/TimeKeeper/backend

# 의존성 설치
uv sync

# 패키지 추가
uv add <package-name>

# 서버 실행
uv run uvicorn main:app --reload --port 8000

# 또는 venv 활성화 후 실행
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

### 설정 파일
- `.python-version`: Python 3.11
- `pyproject.toml`: 의존성 정의
- `uv.lock`: lock 파일 (커밋 필수)

## Development Setup

1. **Chrome Requirements**: Chrome 138+ with on-device model support enabled at `chrome://flags/#optimization-guide-on-device-model`
2. **OAuth Setup**: Configure `secrets.js` with your Google OAuth client ID (copy from `secrets.example.js`)
3. **Load Extension**:
   - Navigate to `chrome://extensions`
   - Enable Developer mode
   - Click "Load unpacked" and select the repository root
4. **First Run**: Open the extension popup and sign in with Google to authorize Calendar access

## Architecture

### Core Components

**background.js** (Service Worker)
- `LanguageModelManager`: Manages Chrome's on-device AI session lifecycle with download progress tracking and caching
- `ResponseCache`: Caches AI responses (5min TTL, max 50 entries) keyed by text hash
- `ApiService`: Handles AI prompt execution and event data validation/normalization
- `CalendarService`: Creates events via Google Calendar API using `chrome.identity` tokens
- `MessageHandler`: Routes messages between content scripts and background worker
- Timezone handling: `getUserTimezone()`, `ensureDateTimeHasOffset()`, `normalizeEventDateTimes()`

**content.js** (Content Script)
- Modal UI rendered on-page with slide-in animation from right
- `BookingPageDetector`: Auto-detects confirmation pages using regex patterns for Korean/English booking sites
- Event card UI with expandable dropdown forms for editing before save
- Dark mode support via `COLOR_PALETTE` with dynamic theme switching
- I18n support via runtime message fetching from `_locales/`

**popup.js** (Extension Popup)
- Settings UI: language, timezone, dark mode, source info toggle, auto-detect toggle
- OAuth login flow using `chrome.identity.getAuthToken()`
- Auto-detects browser language and timezone on first run

### Data Flow

1. User selects text or triggers auto-detection
2. Content script sends `parseText` message to background with `{selectedText, pageInfo}`
3. Background checks `ResponseCache`, then calls `LanguageModelManager.getSession()`
4. AI session processes text with system prompt (always returns array of events)
5. `ApiService.processApiResponse()` validates and normalizes datetime/timezone
6. Content script displays results in modal with editable cards
7. User clicks add → background calls `CalendarService.createCalendarEvent()`

## Key Implementation Details

### AI Session Management
- Base session created once with `initialPrompts` containing system prompt
- Each parse uses `session.clone()` for isolated conversation context
- Download progress broadcast to all tabs via `ProgressUpdater`
- Session reused until page reload (manual cleanup via popup settings possible)

### Timezone Normalization
- Always normalizes to user's configured timezone (from settings or `Intl.DateTimeFormat`)
- `ensureDateTimeHasOffset()` adds offset to ISO strings missing one (e.g., `2024-05-15T14:00:00` → `2024-05-15T14:00:00+09:00`)
- Uses iterative probing (max 3 iterations) to handle DST transitions correctly
- Cached timezone updated via `chrome.storage.onChanged` listener

### Event Validation
- `validateEventDataInCreateEvent()` enforces:
  - Summary required
  - Start/end must both be `date` OR both be `dateTime` (all-day vs timed)
  - Missing end time → auto-set to +1 hour from start
  - Missing end date → auto-set to +1 day from start
  - `attendees` array of strings → converted to description text (API requires email objects)

### Auto-Detection
- Triggers 2s after page load or navigation
- Requires confirmation keyword (`예매완료`, `booking complete`, etc.) in headers/body
- Plus event detail patterns (dates, times, venues) in main content
- Extracts text from highest-scoring element (relevance score calculation)
- Shows soft notification with background parsing → click to open modal

## File Structure

```
/
├── manifest.json          # MV3 manifest (permissions, OAuth, CSP)
├── background.js          # Service worker (AI, Calendar API, caching)
├── content.js             # Content script (modal UI, auto-detect)
├── popup.html/popup.js    # Extension popup (settings, auth)
├── secrets.js             # OAuth client ID (gitignored, use secrets.example.js)
├── _locales/              # i18n message catalogs (en, ko)
│   ├── en/messages.json
│   └── ko/messages.json
├── css/modal.css          # Shared modal styles
├── assets/                # Images (logo, ninja animations)
├── icons/                 # Extension icons (16/48/128)
└── docs/                  # Documentation
    ├── PROJECT_OVERVIEW.md    # Hackathon project overview
    ├── design-guide.md        # UI/UX design system
    ├── release-checklist.md   # Deployment checklist
    └── privacy-policy.html    # Privacy policy
```

## Important Conventions

### Message Passing
All background-content communication uses `chrome.runtime.sendMessage()` with action-based routing:
- `parseText`: Parse text and return event array
- `createCalendarEvent`: Save single event to Calendar
- `updateProgress`: Update modal progress bar (0-100%)
- `closeModal`: Close modal across all tabs
- `getLocaleMessages`: Fetch i18n messages for locale
- `checkAuthStatus` / `performLogin`: OAuth management
- `updateAutoDetectSetting` / `updateDarkMode` / `updateLanguage`: Settings sync

### Chrome AI API Usage
```javascript
// Check availability
const availability = await LanguageModel.availability(); // 'readily' | 'downloading' | 'unavailable'

// Create session with system prompt
const session = await LanguageModel.create({
  temperature: 0.4,
  topK: 8,
  initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }],
  monitor(m) {
    m.addEventListener('downloadprogress', (e) => {
      console.log(`Download: ${e.loaded * 100}%`);
    });
  }
});

// Clone for new conversation
const clonedSession = await session.clone();
const result = await clonedSession.prompt(userText);
```

### Event Format
Google Calendar API format with timezone normalization:
```javascript
{
  summary: "Event Title",           // Required
  start: {
    dateTime: "2024-05-15T14:00:00+09:00",  // OR use "date": "2024-05-15"
    timeZone: "Asia/Seoul"
  },
  end: {
    dateTime: "2024-05-15T15:00:00+09:00",  // Must match start type
    timeZone: "Asia/Seoul"
  },
  location: "Optional location",   // Optional
  description: "Optional notes"    // Optional, source URL appended if enabled
}
```

## Design System

Detailed design specifications are in `docs/design-guide.md`.

### Colors (Light Mode)
- Modal background: `#313B43`
- Header: `#343A40`
- Body: `#F8F9FA`
- Card: `#F6F6F6`
- Text: `#2C3E50`
- Accent: `#E83941`

### Colors (Dark Mode)
- Modal background: `#22272e`
- Header: `#2d333b`
- Body: `#1c2128`
- Card: `rgba(255,255,255,0.03)`
- Text: `#e6edf3`
- Accent: `#ff6b6b`

### UI Patterns
- Modal slides in from right with 0.3s ease-out
- Cards expand with max-height transition (0.4s cubic-bezier)
- Progress bar shows stages: cache_check → downloading → parsing → processing → complete
- Toast notifications auto-dismiss after 3s (info: 5s)
- Border radius: 12-16px for cards, 6-8px for inputs/buttons

## Testing

- **Quick test**: Open `tests/quick-test.html` and click extension icon
- **Comprehensive test**: See `archive/tests/comprehensive-test.html` for edge cases
- **DevTools**: Check service worker console for background logs, page console for content script logs
- **Settings**: Test via popup → language/timezone changes should update all open tabs

## Common Tasks

- **Add new locale**: Create `_locales/{locale}/messages.json`, update `detectDefaultLanguage()` in popup.js
- **Update AI prompt**: Modify `CONFIG.SYSTEM_PROMPT` in background.js (affects all new sessions)
- **Add booking site pattern**: Extend `confirmationPatterns` or `detailPatterns` in `BookingPageDetector`
- **Clear AI cache**: Open popup → Settings → (future: add cache clear button)
- **Debug timezone**: Check console logs prefixed with `🕐`

## Privacy & Security

- 100% on-device AI processing (no data sent to external servers except Google Calendar API)
- OAuth tokens managed by Chrome's identity API
- CSP enforced: `script-src 'self'; object-src 'self'`
- Source URL only attached to events if user enables "Show source info" setting
