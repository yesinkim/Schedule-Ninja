# Schedule Ninja

> Chrome extension that turns snippets you notice on the web into Google Calendar events powered by Chrome's on-device AI.

[한국어](README.ko.md)

## Overview
Schedule Ninja captures meetings, deadlines, and booking confirmations without forcing you off the page. Highlight text, trigger the context menu, or let the extension auto-detect confirmation pages—Schedule Ninja interprets the surrounding context, assembles structured events, and lets you review every field before it reaches a calendar.

## Feature Highlights
- **On-device parsing**: Uses Chrome's `LanguageModel` (Gemini Nano) API with caching to extract one or more events from selected text while keeping data local.
- **Inline event builder**: Presents multiple suggestions, in-place editing, timezone normalization, and a final save action directly from the page overlay.
- **Booking page auto-detect**: Scans confirmation pages, surfaces gentle toasts, and pre-builds events when relevant details are found.
- **Smart source capture**: Optionally attaches the current URL and page context so saved events remain traceable.
- **Adaptive UI**: English and Korean locales, dark mode, and timezone preferences persist via `chrome.storage.sync`.

## User Flow
1. Highlight a sentence, paragraph, or confirmation block that contains schedule details.
2. Right-click and choose `Create Calendar Event`, or rely on auto-detect on supported booking pages.
3. Schedule Ninja sends the selection to the background service worker, which parses it with the on-device LanguageModel.
4. Review each suggested event in the modal, tweak date/time/notes, and add it to Google Calendar.
5. Manage sign-in, language, timezone, and feature toggles from the popup settings surface.

## Component Map
| Path | Description |
| --- | --- |
| `manifest.json` | MV3 manifest defining permissions, OAuth scopes, and entry points. |
| `background.js` | Handles AI session lifecycle, caching, Google Calendar insertion, and message routing. |
| `content.js` | Renders the Schedule Ninja modal, edits suggestions, and runs booking-page auto-detection. |
| `popup.html` / `popup.js` | Hosts sign-in, localization, theme, and auto-detect preferences. |
| `_locales/` | Message catalogs for English and Korean UI strings. |
| `css/modal.css` | Shared styling for the inline event builder. |
| `assets/`, `icons/` | Brand visuals used by the modal and extension surfaces. |
| `secrets.js` | Stores the Google OAuth client id used by `chrome.identity`. |
| `archive/` | Historical design guides, release notes, and reference docs. |

## Setup
1. **Browser requirements**: Use Chrome 138 or newer with on-device model support enabled (e.g., `chrome://flags/#optimization-guide-on-device-model`).
2. **OAuth client**: Confirm `secrets.js` contains your `GOOGLE_CLIENT_ID`. Update it if you manage a separate Google Cloud project.
3. **Load the extension**: Visit `chrome://extensions`, enable *Developer mode*, choose *Load unpacked*, and select the repository root.
4. **Authorize Calendar access**: Open the extension popup and sign in with Google. The background service stores the token via `chrome.identity` when events are saved.

## Development Notes
- `LanguageModelManager` creates and reuses Chrome AI sessions, reporting download progress back to the modal via `ProgressUpdater`.
- `ResponseCache` avoids repeated prompts for the same text and reapplies the active timezone preference on reuse.
- Settings are persisted in `chrome.storage.sync` and mirrored in both the modal and popup for consistent UX.
- The booking detector prioritizes Korean ticketing patterns today; extend the regex lists in `content.js` to support additional locales or providers.
- `secrets.example.js` remains for compatibility with earlier builds that used external APIs; the current branch relies solely on on-device models.

## Roadmap
- Expand auto-detect heuristics beyond Korean ticketing pages and add analytics hooks to tune accuracy.
- Surface lightweight activity history to revisit recently saved events.
- Introduce unit tests around timezone normalization and AI response validation.

## Contributing
Feedback fuels iteration. File issues for bugs, auto-detect edge cases, or ideas that refine the AI prompt/UI loop. Designers, prompt engineers, and productivity enthusiasts are all welcome to shape the next release of Schedule Ninja.
