## 2024-08-24 - Accessibility state attributes and hidden labels
**Learning:** Found that the responsive mobile menu toggle button (`apps/web/src/components/layout/app-shell.tsx`) was missing `aria-expanded` to communicate its state to screen readers. Also, discovered that the chat input field (`apps/web/src/app/projects/repo-chat.tsx`) lacked an explicit `<label>`, so using `aria-label` provides a hidden label that screen readers can rely on.
**Action:** Ensure dynamic UI components explicitly declare their open/closed states using `aria-expanded`, and always provide an `aria-label` to form fields without an explicit visual label.

## 2024-08-24 - Visual progress and score indications
**Learning:** Found that custom data visualization components like `ConfidenceRing` and `ScoreBar` lacked semantic meaning for screen readers. Although they visually depicted scores out of 100, the raw numbers provided little context audibly, and decorative elements (like SVG circles and bar tracks) could be confusing or redundant.
**Action:** When building custom data visualizations like scores or progress bars, use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, and `aria-valuemax` to give screen readers proper context. Ensure the wrapper has a descriptive `aria-label` and hide decorative or redundant inner visual elements with `aria-hidden="true"`.
