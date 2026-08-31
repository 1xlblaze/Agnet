## 2024-08-24 - Accessibility state attributes and hidden labels
**Learning:** Found that the responsive mobile menu toggle button (`apps/web/src/components/layout/app-shell.tsx`) was missing `aria-expanded` to communicate its state to screen readers. Also, discovered that the chat input field (`apps/web/src/app/projects/repo-chat.tsx`) lacked an explicit `<label>`, so using `aria-label` provides a hidden label that screen readers can rely on.
**Action:** Ensure dynamic UI components explicitly declare their open/closed states using `aria-expanded`, and always provide an `aria-label` to form fields without an explicit visual label.

## YYYY-MM-DD - Systemic keyboard focus indicators
**Learning:** Found that multiple interactive elements like buttons, skill chips, and navigation links lacked visual focus indicators, making keyboard navigation difficult or impossible to track.
**Action:** Apply `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color]` utilities to all interactive UI components, ideally at the base component class level (e.g., `.btn` in `globals.css`) to ensure systemic keyboard accessibility without disrupting mouse users.
