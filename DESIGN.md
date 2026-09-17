# DocuSphere Design System
*Single source of truth for the visual redesign. All styling decisions reference this document.*

---

## Design Direction: "Operational Clarity"

DocuSphere is a daily-use internal tool for employees — not a SaaS marketing site and not a developer console. The visual language should communicate:

- **Reliability** — consistent, predictable visual patterns so users build muscle memory fast
- **Density with breathing room** — tables hold real data; cards are purposeful, not decorative
- **Clear status communication** — at a glance, a user knows whether a document is approved, expiring, or pending
- **Zero developer noise** — no phase badges, no JWT implementation details, no raw API paths visible to users

The reference aesthetic: Vercel dashboard, Linear app, Retool — dark, precise, high information density, restrained use of color.

> **Scope — dark mode only (intentional):** The existing application is dark-only. This design system defines dark mode tokens exclusively. Light mode is a non-requirement for the current deployment. If a light mode variant is ever required (e.g. accessibility accommodation, a client environment), a separate `light.css` token layer should be added — *not* retrofitted into the existing component classes. Do not add `dark:` Tailwind prefixes speculatively.

---

## 1. Typography

### Font Imports (replace existing `@import` in `index.css`)
```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Font Roles
| Role | Font | Usage |
|---|---|---|
| **Display / Heading** | `Plus Jakarta Sans` | Page titles, section headings, modal titles, dashboard hero |
| **Body / UI** | `Inter` | All body text, labels, button text, table content, form inputs |
| **Mono** | `JetBrains Mono` | File sizes, version numbers (`v3`), document IDs, timestamps, code |

**Tailwind mapping:**
```js
fontFamily: {
  display: ['Plus Jakarta Sans', 'sans-serif'],
  sans: ['Inter', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Type Scale
Replace all ad-hoc `text-[9px]`, `text-[10px]`, `text-[11px]` with these defined steps:

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-2xs` | `11px` | 500 | Micro-labels: badge text, table column headers |
| `text-xs` | `12px` | 400/500 | Metadata: timestamps, helper text, secondary rows |
| `text-sm` | `13px` | 400/500 | Primary body: table cells, form inputs, dropdown items |
| `text-base` | `15px` | 400 | Modal body text, descriptions |
| `text-lg` | `17px` | 600 | Section headings |
| `text-xl` | `20px` | 700 | Page-level headings |
| `text-2xl` | `24px` | 700 | Hero/welcome banner |

Add to tailwind config:
```js
fontSize: {
  '2xs': ['11px', { lineHeight: '16px', letterSpacing: '0.01em' }],
}
```

---

## 2. Color Palette

### Background Layers (strict elevation model — higher = lighter)
| Token | Hex | Usage |
|---|---|---|
| `--bg-base` | `#0B0E14` | App background, page canvas |
| `--bg-surface` | `#111520` | Cards, panels, sidebar |
| `--bg-raised` | `#171C2C` | Modal bodies, dropdowns, tooltips |
| `--bg-overlay` | `#1E2438` | Hover row, active input fill, selected state |
| `--bg-subtle` | `#252D42` | Secondary button, filter panel background |

### Borders
| Token | Hex | Usage |
|---|---|---|
| `--border-subtle` | `#1B2035` | Dividers between rows, section separators |
| `--border-default` | `#232A40` | Card borders, input borders |
| `--border-strong` | `#3A4560` | Focus rings, active element borders |
| `--border-focus` | `#5B7CF6` | Input focus ring |

### Text (verified contrast ratios against --bg-base #0B0E14)
| Token | Hex | Contrast | WCAG | Usage |
|---|---|---|---|---|
| `--text-primary` | `#E2E6F0` | **15.46:1** | AAA | Primary content: names, titles, body |
| `--text-secondary` | `#7D8AA0` | **5.53:1** | AA | Secondary metadata: filenames, helper text |
| `--text-muted` | `#5B6880` | **3.44:1** | AA-large only | De-emphasized text: section labels, timestamps — **only 14px+ or bold** |
| `--text-disabled` | `#424E66` | **2.31:1** | FAIL | Placeholder text in inputs, truly decorative labels — **never for readable content** |

> **Important:** `--text-disabled` (#424E66) has a 2.31:1 ratio — it fails WCAG AA at all sizes. Use it **only** for `input::placeholder` and non-interactive decorative text. Any text a user is expected to read must use `--text-muted` or above.

### Brand (Primary Action Color)
Not generic Tailwind `blue-500`. A cool indigo-blue: `#5B7CF6`

| Token | Hex | Usage |
|---|---|---|
| `--brand` | `#5B7CF6` | Primary buttons, active nav, links, focus rings |
| `--brand-hover` | `#4A6AE8` | Hover state for primary |
| `--brand-subtle` | `#5B7CF614` | Active nav background, selected card tint |
| `--brand-border` | `#5B7CF630` | Active nav border, card hover border |

### Status Colors (semantic — four only, used everywhere consistently)
| Status | Hex | Contrast vs bg-base | Used for |
|---|---|---|---|
| **Approved / Success** | `#2DD4A0` | 10.15:1 AA | `APPROVED` badge, success toasts |
| **Pending / Warning** | `#F0A429` | 9.24:1 AA | `PENDING` badge, expiring soon |
| **Rejected / Error** | `#E85252` | 5.30:1 AA | `REJECTED` badge, error states, delete confirmation |
| **Draft / Neutral** | `#5B6880` | 3.44:1 AA-large | `DRAFT` badge (used at font-semibold, never small regular weight) |

### Role Identity Colors (separate from status — badge use only)
These identify *who someone is*, not the state of a document. They must never appear on buttons, backgrounds, or decorative elements outside of role badges.

| Role | Hex | Contrast vs bg-base | Used on |
|---|---|---|---|
| Admin | `#9B7EE8` | 6.02:1 AA | `ADMIN` role badge, Admin nav tab active state only |
| Manager | `#5B7CF6` | 5.21:1 AA | `MANAGER` role badge (same as brand — intentional) |
| Viewer | `#2DD4A0` | 10.15:1 AA | `VIEWER` role badge (same as Approved — acceptable; role badges and status badges don't appear in the same context) |

> **Admin purple (#9B7EE8) scoping:** This is not a 5th semantic color. It is scoped exclusively to the `ADMIN` role badge and the Admin section nav active state. It does not appear on buttons, card borders, hover states, filter panels, or anywhere outside role identification. The "four status colors" rule is unchanged.

### Colors Removed
Tailwind `violet`, `teal`, `indigo`, `lime`, `orange`, `yellow` (as accents) — replaced by the 4-color semantic system above.

---

## 3. Icon Treatment Rules

**Library:** Lucide React exclusively.

### Sizes — three only
| Size | px | Context |
|---|---|---|
| `w-3.5 h-3.5` | 14px | Inline with text (badges, button labels) |
| `w-4 h-4` | 16px | Action buttons, nav items |
| `w-5 h-5` | 20px | Empty state, stat card icons |

### Color Rules
- **File-type icons**: fixed semantic colors (PDF=red, Image=teal, Spreadsheet=teal, Archive=amber, Code=purple, Generic=brand)
- **All other icons**: `currentColor` — inherit from surrounding text/button

### Prohibition Rules
- ❌ No icons on table column headers
- ❌ No icons on form labels
- ❌ No icons on section headings
- ❌ No `Sparkles` icon anywhere in production UI
- ✅ Icons are appropriate on: action buttons, empty states, stat cards, notification type indicators, file type column

---

## 4. Component Patterns

### Buttons — Three levels only
```
Primary:   bg-[#5B7CF6] hover:bg-[#4A6AE8] text-white rounded-lg
Secondary: bg-[#1E2438] hover:bg-[#252D42] border border-[#232A40] text-[#E2E6F0] rounded-lg
Danger:    bg-[#E85252]/10 hover:bg-[#E85252]/20 text-[#E85252] border border-[#E85252]/25 rounded-lg
Ghost:     no bg, text-[#7D8AA0] hover:text-[#E2E6F0] (icon-only actions)
```
All buttons: `rounded-lg` (8px). Only cards/modals use `rounded-xl` (12px).

### Status Badges
```
text-2xs font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full
APPROVED:  bg-[#2DD4A0]/12 text-[#2DD4A0] border border-[#2DD4A0]/25
PENDING:   bg-[#F0A429]/12 text-[#F0A429] border border-[#F0A429]/25
REJECTED:  bg-[#E85252]/12 text-[#E85252] border border-[#E85252]/25
DRAFT:     bg-[#5B6880]/12 text-[#7D8AA0] border border-[#5B6880]/25
```
No `animate-pulse` — visually fatiguing in daily-use tools.

### Cards
```
bg-[#111520] border border-[#232A40] rounded-xl p-5
hover: border-[#3A4560] bg-[#171C2C]
```

### Tables
```
Container:   bg-[#111520] border border-[#232A40] rounded-xl overflow-hidden
Header row:  bg-[#0B0E14] text-2xs text-[#5B6880] uppercase tracking-wide font-semibold py-2.5 px-4
Body rows:   text-sm text-[#E2E6F0] py-2.5 px-4  hover:bg-[#1E2438]
Dividers:    divide-y divide-[#1B2035]
```

### Modals
```
Overlay:     bg-black/50 backdrop-blur-sm
Container:   bg-[#111520] border border-[#232A40] rounded-xl shadow-2xl
Header:      p-5 border-b border-[#1B2035]  — title font-display text-lg font-semibold
Body:        p-5 space-y-4
Footer:      p-4 border-t border-[#1B2035] flex justify-end gap-3
```
Destructive modals: add `border-[#E85252]/30` on container + red header treatment.

### Input Fields
```
bg-[#0B0E14] border border-[#232A40] rounded-lg px-3 py-2 text-sm
placeholder:text-[#424E66]
focus:border-[#5B7CF6] focus:ring-1 focus:ring-[#5B7CF6]/25
```

---

## 5. Spacing & Layout

| Context | Rule |
|---|---|
| Page container | `max-w-7xl mx-auto px-6` |
| Page sections | `space-y-6` |
| Within a card | `p-5`, internal `space-y-4` |
| Table cells | `py-2.5 px-4` |
| Toolbar / action bar | `py-3 px-4`, `gap-3` between items |
| Navbar height | `h-14` (56px) |
| Inline gap (icon+text) | `gap-2` |
| Card grid gap | `gap-4` |
| Modal section gap | `gap-5` |

---

## 6. Content & Copy Rules

| Rule | Example |
|---|---|
| Remove all dev milestone text | No "Phase 1", "Phase 2", "JWT Bearer", "Postgres 18" |
| Short nav labels | "Explorer" not "Document Explorer", "Admin" not "Admin Role Management" |
| Human-readable status | "Approved", "Pending Review", "Rejected", "Draft" — never ALL_CAPS enums |
| Action-oriented empty states | "Upload your first document" not "No documents found" |
| Relative timestamps, exact on hover | "2 hours ago" with `title="Sep 13, 2026 2:14 AM"` |

---

## 7. What Is Removed

| Element | Reason |
|---|---|
| `blur-3xl` ambient blob decorations | Consumer SaaS aesthetic |
| `glass-panel` / `glass-panel-elevated` utilities | Replaced by flat elevation model |
| `.glow-*` shadow utilities | Not needed in new palette |
| `animate-pulse` on status badges | Fatiguing in daily use |
| `Sparkles` icon | Associated with AI/magic branding |
| Live RBAC Permission Tester section | Developer tool — remove from Dashboard |
| Developer session card (User ID, JWT details, Postgres version) | Not user-relevant |
| "Phase N" badge in navbar | Development milestone, not production copy |
---

## 8. Responsive / Mobile Guidance

This is a desktop-first tool. The primary workflow (browse, upload, rename, approve) is designed for screen widths ≥ 1024px. However, a meaningful subset of users will need to **view and approve** documents on tablet or phone.

### Breakpoint Strategy
| Breakpoint | Min width | Target | Changes |
|---|---|---|---|
| `sm` | 640px | Large phone (landscape) | Hide non-essential table columns (Size, Version); collapse action buttons to a single `⋯` overflow menu |
| `md` | 768px | Tablet portrait | Folder grid drops to 2 columns; filter panel stacks vertically |
| `lg` | 1024px | Laptop / desktop | Full layout — all columns visible, 4-column folder grid |

### Table Column Priority (for responsive hiding)
| Column | Priority | Hidden below |
|---|---|---|
| Name | Required | Never |
| Status badge | Required | Never |
| Actions | Required | Never |
| Uploaded By | High | — |
| Date | Medium | `sm` |
| Version | Low | `sm` |
| Size | Low | `sm` |

### Mobile-specific Notes
- The document preview (inline PDF/image viewer) should be full-screen on mobile — no sidebar
- Upload is disabled on mobile (no file picker for the drag-and-drop zone) — redirect to a "Use desktop to upload" message
- Notifications dropdown should become a full-width bottom sheet on screens < 640px
- The navbar collapses to logo + hamburger menu below `md`; show only Explorer and logout in the mobile drawer

> **Scope clarification:** Mobile support for this initial pass covers *viewing, approving, and downloading* documents. Upload, folder management, and admin tasks remain desktop-only. This is intentional, not an oversight.
