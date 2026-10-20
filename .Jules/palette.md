## 2024-08-24 - Accessibility state attributes and hidden labels
**Learning:** Found that the responsive mobile menu toggle button (`apps/web/src/components/layout/app-shell.tsx`) was missing `aria-expanded` to communicate its state to screen readers. Also, discovered that the chat input field (`apps/web/src/app/projects/repo-chat.tsx`) lacked an explicit `<label>`, so using `aria-label` provides a hidden label that screen readers can rely on.
**Action:** Ensure dynamic UI components explicitly declare their open/closed states using `aria-expanded`, and always provide an `aria-label` to form fields without an explicit visual label.

## 2024-09-04 - Active link states and decorative icons
**Learning:** Found that active navigation links were missing the `aria-current="page"` attribute, making it difficult for screen reader users to identify their current location in the app. Furthermore, decorative icons within the navigation elements lacked `aria-hidden="true"`, causing screen readers to potentially announce unnecessary visual elements.
**Action:** Always ensure that active state on navigation elements is properly conveyed via `aria-current="page"`, and hide purely decorative components (like SVG icons without semantic meaning in context) using `aria-hidden="true"`.
