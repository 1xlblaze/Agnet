## 2024-08-24 - Accessibility state attributes and hidden labels
**Learning:** Found that the responsive mobile menu toggle button (`apps/web/src/components/layout/app-shell.tsx`) was missing `aria-expanded` to communicate its state to screen readers. Also, discovered that the chat input field (`apps/web/src/app/projects/repo-chat.tsx`) lacked an explicit `<label>`, so using `aria-label` provides a hidden label that screen readers can rely on.
**Action:** Ensure dynamic UI components explicitly declare their open/closed states using `aria-expanded`, and always provide an `aria-label` to form fields without an explicit visual label.

## 2024-05-24 - Standardizing Focus States
**Learning:** Keyboard navigation was missing clear visual indicators across all buttons sharing the `.btn` base class. Without focus rings, keyboard-only users struggle to track their current position on the page.
**Action:** Applied `focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas` utilities centrally to the `.btn` base class in `globals.css`, ensuring a consistent, accessible focus experience across all button variants.
