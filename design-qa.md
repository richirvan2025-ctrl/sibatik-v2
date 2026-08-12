# Design QA — New Ticket Guided Form

- Route: `https://sibatik.idbbali.ac.id/tickets/new`
- Reference source: `C:/Users/Lenovo/.codex/generated_images/019fefc8-9c46-7210-af65-fffb5c72dbda/exec-a57db29f-6a74-40a6-8b36-af4f5d061559.png`
- Implementation screenshot: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/option2/implementation-qa-1488x1058.png`
- Full comparison: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/option2/comparison-final.png`
- Focused form comparison: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/option2/comparison-form-focused.png`
- Desktop viewport: 1488 × 1058 CSS px
- Desktop screenshot: 1488 × 1058 px
- Device pixel ratio: 1
- Mobile viewport: 390 × 844 CSS px
- State: authenticated executive user; empty form; production build

## Comparison result

The production form matches the selected visual direction: one cohesive card, three numbered sections, a continuous vertical guide, full-width title and description fields, paired division/priority and deadline/helper rows, compact attachment zone, and a contained action footer. The existing SIBATIK header, sidebar, back action, typography, and Bali batik treatment remain intact.

The focused comparison confirms the form hierarchy, spacing rhythm, field proportions, border radii, purple accents, priority status dot, helper copy, upload treatment, and bottom action grouping. Production intentionally retains the back link and multi-division helper copy because they are established product requirements.

## Required surfaces

- Typography: passed — headings, labels, helpers, and placeholders preserve the SIBATIK type scale and hierarchy.
- Spacing/layout: passed — all three sections and desktop actions fit in the 1488 × 1058 reference viewport; no horizontal overflow at 390 px.
- Colors/borders/shadows: passed — navy text, purple accents, amber priority indicator, neutral borders, subtle card shadow, and tinted helper/upload surfaces match the reference direction.
- Image assets: passed — existing SIBATIK logo and Bali batik header asset are preserved; no placeholder or simulated assets added.
- Copy/content: passed — requested Indonesian subtitle and field copy are present; required and optional states are explicit.
- Icons: passed — existing Lucide icon set is used consistently for search, chevrons, information, calendar, upload, and submit actions.
- Responsiveness: passed — desktop uses paired columns and right-aligned actions; mobile stacks fields, upload content, and actions with full-width touch targets.
- Accessibility: passed — labels, required state, `aria-invalid`, descriptive help/error associations, combobox/listbox semantics, radio labels, and assertive error summary are present.

## Interaction checks

- Division picker opens, filters, exposes a multi-select listbox, supports two simultaneous selections, and reveals the assignee control.
- Priority selector changes from Medium to High correctly.
- Attachment mode switches from File to Link correctly.
- Empty submission creates no ticket, displays Indonesian inline errors, announces the summary, scrolls to, and focuses the first invalid field.
- Mobile top and bottom states were visually checked at 390 × 844; primary and secondary actions remain reachable.
- Browser console was checked. No SIBATIK application errors were observed; reported errors originated only from an unrelated Chrome extension URL.

## Iteration history

1. Initial implementation comparison found that the footer actions sat just below the reference viewport.
2. Header placement and textarea height were tightened while preserving the required back action.
3. Section rhythm was reduced from 24 px to 16 px and section content offset from 16 px to 12 px.
4. Final full-view and focused comparisons passed with all content and actions visible.

No open P0, P1, or P2 visual defects remain.

final result: passed
