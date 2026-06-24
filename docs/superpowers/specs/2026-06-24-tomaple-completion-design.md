# ToMaple Completion Design

## Goal

Raise the perceived completion level of the existing ToMaple productivity app by making visible controls functional, adding a top-right dark mode setting, and keeping the experience consistent across pages.

## Scope

- Add a global settings surface opened from the TopBar.
- Store theme preference in localStorage and apply it to the whole app.
- Make TopBar search, notifications, and settings perform visible actions.
- Replace inert sidebar links and page icon controls with useful navigation, filtering, or feedback.
- Improve empty states and secondary actions where lists can be empty.

## Architecture

Theme state lives in a small client provider wrapped around the app shell. The TopBar consumes that provider and owns lightweight UI state for search results, notification summaries, and the settings popover. Existing page data stays in the current localStorage keys.

## Components

- `components/ThemeProvider.tsx`: manages `light` / `dark` theme and writes `data-theme` on the root element.
- `components/TopBar.tsx`: adds search, notifications, settings panel, and theme toggle.
- `components/Sidebar.tsx`: turns bottom helper links into working navigation/actions.
- App pages: add functional controls for filters, reset actions, quick creation, and menu actions.

## Testing

Run `npm run build` after edits. Start the dev server and inspect the page in a browser to confirm the settings popover opens, dark mode changes the UI, and formerly inert buttons now give feedback or perform actions.
