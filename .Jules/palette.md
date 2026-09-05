## 2024-08-24 - Accessibility state attributes and hidden labels
**Learning:** Found that the responsive mobile menu toggle button (`apps/web/src/components/layout/app-shell.tsx`) was missing `aria-expanded` to communicate its state to screen readers. Also, discovered that the chat input field (`apps/web/src/app/projects/repo-chat.tsx`) lacked an explicit `<label>`, so using `aria-label` provides a hidden label that screen readers can rely on.
**Action:** Ensure dynamic UI components explicitly declare their open/closed states using `aria-expanded`, and always provide an `aria-label` to form fields without an explicit visual label.
## 2024-05-09 - Global Keyboard Focus State
**Learning:** Found that custom button classes (`.btn`) in `globals.css` were missing visible focus states for keyboard navigation, affecting keyboard users globally across the app.
**Action:** Added `focus-visible` styles to the base `.btn` class instead of individually on components. This reusable UX pattern ensures every button using this component implicitly inherits strong, accessible focus rings that are only shown during keyboard navigation (not on click).
