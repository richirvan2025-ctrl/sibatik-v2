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

## Ticket detail redesign — Operational Brief

- Route: `https://sibatik.idbbali.ac.id/tickets/cmsoft6ag0001jphojcoiyvnn`
- Selected reference: `C:/Users/Lenovo/.codex/generated_images/019fefc8-9c46-7210-af65-fffb5c72dbda/exec-c624e3ec-a698-47c7-a55b-ca66c3e0710c.png`
- Production screenshot: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/ticket-detail-redesign/qa/prod-final-desktop.png`
- Side-by-side comparison: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/ticket-detail-redesign/qa/reference-vs-production-final.png`
- Desktop viewport: 1487 × 1058 CSS px
- Mobile viewport: 390 × 844 CSS px
- State: authenticated executive user; ticket TKT-2026-00001; production build

### Comparison result

The production page matches the selected Operational Brief direction: a quiet back action, prominent ticket number and title, a single four-part operational summary, a wide content column, and a structured information panel. The previous decorative purple and cyan top bars were removed. Borders and shadows are intentionally restrained, with semantic blue, orange, and red used only for operational status.

The final same-viewport side-by-side comparison confirms the content width, vertical rhythm, summary proportions, two-column balance, information panel height, typography hierarchy, empty-comment state, and preserved SIBATIK shell. Exact production content remains unchanged.

### Required surfaces

- Typography: passed — title, ticket number, section headings, labels, and values have clear hierarchy and readable wrapping.
- Spacing/layout: passed — desktop composition fits the selected reference proportions; no horizontal overflow at 1487 px or 390 px.
- Colors/borders/shadows: passed — neutral cards and borders use restrained shadows; status and deadline colors remain semantic.
- Image assets: passed — existing SIBATIK logo and Bali batik header asset are preserved without modification.
- Copy/content: passed — title, description, category, author, assignee, created date, deadline, status, and priority match the ticket data.
- Icons: passed — the existing Lucide icon system is used consistently; no placeholder or handcrafted icons were added.
- Responsiveness: passed — the four-part summary and ticket cards stack cleanly at 390 × 844 with 358 px card widths and no clipping.
- Accessibility: passed — page hierarchy uses header/main/aside landmarks, the summary has an accessible label, decorative icons are hidden, and the back action remains keyboard accessible.

### Interaction and runtime checks

- The `Kembali` action was clicked in Chrome, navigated to the ticket list, and the ticket route was reopened successfully.
- All expected ticket values were verified as visible in the production DOM.
- The production build and TypeScript checks passed.
- ESLint reported no errors; one pre-existing `next/no-img-element` warning remains for attachment previews.
- No SIBATIK application console errors were observed. Reported messages originated from an unrelated Chrome extension listener.
- No open P0, P1, or P2 visual defects remain.

final result: passed

## Header parity update — Siprodi reference

- Reference route: `https://siprodi.idbbali.ac.id/umum/dashboard.php`
- Implementation route: `https://sibatik.idbbali.ac.id/tickets/new`
- Reference screenshot: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/header-compare/04-siprodi-matched.png`
- Implementation screenshot: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/header-compare/05-sibatik-matched.png`
- Same-state comparison: `C:/Users/Lenovo/Documents/Codex/2026-08-11/ssh/work/header-compare/06-header-comparison.png`
- Comparison viewport: 1440 × 900 CSS px

Measured Siprodi header height is 50px with a 17px shadow. SIBATIK now uses the same 50px header height and 17px shadow reach, with controlled opacity to suit the darker branded header. The sidebar logo row is also 50px so the horizontal seam remains aligned. The Bali batik image, edge fade, navigation controls, and existing functionality remain unchanged.

- Desktop header height and visual alignment: passed.
- Shadow visibility and separation from page content: passed.
- Mobile 390 × 844 layout, tap target fit, and horizontal overflow: passed.
- Application console errors on the checked route: none.
- Open P0/P1/P2 defects: none.

final result: passed
