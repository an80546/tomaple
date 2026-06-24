# ToMaple Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ToMaple feel complete by wiring visible controls and adding global dark mode.

**Architecture:** Add a client theme provider and keep page interactions local to their current files. Use the existing localStorage helper and Next app shell rather than introducing new state libraries.

**Tech Stack:** Next.js App Router, React client components, Tailwind CSS v4 theme tokens, localStorage.

---

### Task 1: Product Context And Theme Foundation

**Files:**
- Create: `PRODUCT.md`
- Create: `components/ThemeProvider.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] Add product context so future UI work follows a product register.
- [ ] Implement a theme provider with `theme`, `resolvedTheme`, `setTheme`, and `toggleTheme`.
- [ ] Wrap the app shell in the provider.
- [ ] Add dark theme CSS variable overrides under `html[data-theme="dark"]`.
- [ ] Run `npm run build` and verify the app compiles.

### Task 2: TopBar Functional Settings

**Files:**
- Modify: `components/TopBar.tsx`

- [ ] Wire the search field to submit and show a small result panel.
- [ ] Wire the notifications icon to a popover with local activity summaries.
- [ ] Wire the settings icon to a popover with a dark mode toggle.
- [ ] Add keyboard escape/click handling where appropriate.
- [ ] Run `npm run build`.

### Task 3: Page-Level Inert Controls

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `app/page.tsx`
- Modify: `app/pomodoro/page.tsx`
- Modify: `app/preparation/page.tsx`
- Modify: `app/projects/page.tsx`
- Modify: `app/notes/manage/page.tsx`

- [ ] Make sidebar help/history links navigate to useful existing pages or anchors.
- [ ] Make the home history filter toggle visible filtering.
- [ ] Make the pomodoro overflow menu expose reset and task actions.
- [ ] Add missing quick-add or clear actions to preparation/projects management areas.
- [ ] Run `npm run build`.

### Task 4: Verification

**Files:**
- No new files.

- [ ] Start the dev server with `npm run dev`.
- [ ] Inspect desktop and mobile-width layouts in the browser.
- [ ] Verify dark mode persists after refresh.
- [ ] Verify formerly inert buttons now open panels, navigate, or change state.
