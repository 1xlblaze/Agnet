## 2024-08-24 - Accessibility state attributes and hidden labels
**Learning:** Found that the responsive mobile menu toggle button (`apps/web/src/components/layout/app-shell.tsx`) was missing `aria-expanded` to communicate its state to screen readers. Also, discovered that the chat input field (`apps/web/src/app/projects/repo-chat.tsx`) lacked an explicit `<label>`, so using `aria-label` provides a hidden label that screen readers can rely on.
**Action:** Ensure dynamic UI components explicitly declare their open/closed states using `aria-expanded`, and always provide an `aria-label` to form fields without an explicit visual label.

## 2024-08-24 - Explicit focus states for custom interactive elements
**Learning:** Found that globally styled components like `.btn` and custom interactive elements like `NavLink` in `app-shell.tsx` and suggestion buttons in `repo-chat.tsx` were missing explicit `focus-visible` styles, relying on browser defaults which can be inconsistent or have insufficient contrast against our custom theme colors.
**Action:** Always provide explicit focus rings using `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent` (and `ring-offset` where applicable) for custom buttons, links, and interactive elements to ensure clear, accessible keyboard navigation.
