# Repository Guidelines

**Upcoming Event**: We plan to present at the [Google Chrome AI Hackathon 2025](https://googlechromeai2025.devpost.com/?ref_feature=challenge&ref_medium=your-open-hackathons&ref_content=Submissions+open).

## Project Structure & Module Organization
- Core extension files live at the repo root: `manifest.json`, `background.js`, `content.js`, and `popup.*`. Keep shared UI assets in `assets/` and icon sprites in `icons/`.
- Treat `docs/design-guide.md` as the UI contract—color tokens, border radii, and ninja theming should flow from there.
- Use `quick-test.html` for manual regression; it mirrors common parsing scenarios and surfaces layout regressions quickly.

## Documentation Structure
| File | Description |
|------|-------------|
| `README.md` | User-facing introduction (English) |
| `README.ko.md` | User-facing introduction (Korean) |
| `CLAUDE.md` | Detailed development guide for Claude Code |
| `docs/PROJECT_OVERVIEW.md` | Hackathon submission project overview |
| `docs/design-guide.md` | UI/UX design system |
| `docs/release-checklist.md` | Pre-deployment checklist |
| `docs/privacy-policy.html` | Privacy policy |

## Build, Test, and Development Commands
- Load the unpacked extension via `chrome://extensions` → Developer Mode → Load unpacked → select the repository root.
- For isolated UI checks, serve the repo with `python3 -m http.server` and open `quick-test.html` so Chrome APIs have a page context.
- When iterating on context menus, reload the extension after each change so MV3 service workers pick up the latest code.

## Coding Style & Naming Conventions
- JavaScript sticks to 2-space indentation, semicolons, ES2020 syntax, `camelCase` for functions/variables, and `UPPER_SNAKE_CASE` for configuration constants.
- Keep background logic modular; wrap Chrome API calls in helpers to avoid duplicated permission prompts.
- Follow the naming rhythm in `docs/design-guide.md` for IDs/classes so new components inherit existing styles.

## Design & UX Guidelines
- Match palette, typography, and corner radii to the specs in `docs/design-guide.md` before submitting a PR.
- Validate spacing, iconography, and hover states in both `popup.html` and the runtime modal rendered by `content.js`.
- Document any intentional UX deviations (e.g., new motion, accessibility tweaks) in the PR description.

## Testing Guidelines
- Manually step through `quick-test.html`, inspect the modal payload in DevTools, and verify Google Calendar hand-off after every parser change.
- Capture console logs or screenshots for tricky cases; attach them to the PR to streamline review.
- Log manual verification steps in the PR body so others can replay them.

## Commit & Pull Request Guidelines
- Write imperative commits like `feat: 이벤트 파싱 개선` or `fix: 팝업 토글 버그 수정` and keep unrelated changes out of the diff.
- PRs should include a concise summary, linked issues, UI screenshots or GIFs for visual updates, and a checklist of manual checks performed.

## Security & Configuration Notes
- Keep real secrets out of `secrets.js`, ensure `manifest.json` permissions stay minimal, and bump the version whenever user-facing behaviour changes.
- Revisit `docs/release-checklist.md` before packaging to avoid shipping debug logs, placeholder assets, or experimental files.
