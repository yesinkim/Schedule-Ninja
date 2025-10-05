# Schedule Ninja

> AI assistant that turns any schedule hint on the web into a clean Google Calendar event without leaving the page.

[한국어](README.ko.md)

## Overview
Schedule Ninja is a Chrome extension designed to remove the friction of capturing meetings, deadlines, and invitations encountered while browsing. Highlight a sentence in an article, a date in an email, or an image of a poster—Schedule Ninja interprets the context, pre-fills a structured event, and streamlines confirmation. By combining on-device intelligence with a focused review experience, it keeps calendars accurate without slowing you down.

## Key Benefits
- **Immediate capture**: Create calendar events the moment you notice them, instead of saving links or drafting reminders.
- **Reduced errors**: Natural language parsing ensures dates, times, and locations are interpreted correctly.
- **Decision-ready preview**: A single popup concentrates the essential fields so you can approve, adjust, or discard in seconds.
- **Privacy-aware AI**: Core understanding runs locally using Gemini Nano, keeping sensitive browsing context on the device.

## Workflow
1. Drag or right-click any text or image that mentions a potential meeting or deadline.
2. Schedule Ninja collects the relevant context from the page and prepares an event draft.
3. Review the populated title, attendees, location, time, and notes in the popup.
4. Confirm to send the event to Google Calendar, or tweak details before saving.
5. Track recent actions and revisit edits through the in-extension activity log.

## Intelligent Capabilities
- **Prompt API** converts highlighted content into a structured event schema ready for Calendar insertion.
- **Summarizer API** condenses lengthy sources—newsletters, briefs, meeting notes—into concise scheduling cards.
- **Proofreader API** polishes event descriptions for clarity when you add manual notes.
- **Translator API** (planned) will normalize multilingual invitations into a consistent format.

## Product Architecture
| Component | Role |
| --- | --- |
| `manifest.json` | Defines the MV3 configuration, permissions, and extension entry points. |
| `content.js` | Observes DOM context, captures user selections, and renders the inline modal. |
| `background.js` | Orchestrates AI requests, manages API credentials, and submits events to Google Calendar. |
| `popup.html` / `popup.js` | Provides the review and confirmation interface with recent activity snapshots. |
| `assets/`, `icons/` | Houses brand visuals and shared UI elements that express the ninja identity. |

## Design Principles
- Follow the palette, typography, and rounded geometry specified in `design-guide.md` for visual consistency.
- Keep focus on the primary decision—approve, modify, or dismiss—by limiting noise in the popup layout.
- Use microfeedback (subtle loading states, confirmation toasts) to communicate background AI activity.

## Looking Ahead
- Extend location-aware events with contextual suggestions such as nearby cafés or meeting rooms.
- Explore collaborative timelines so teams can confirm shared availability directly from captured content.
- Introduce follow-up tasks generated from recurring meeting notes and agendas.

## Contributing
Feedback fuels iteration. File issues for bugs, enhancement ideas, or API experiments. Designers, prompt engineers, and productivity enthusiasts are all welcome to shape the next release of Schedule Ninja.
