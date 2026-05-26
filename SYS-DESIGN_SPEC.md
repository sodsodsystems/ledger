# Finance Tracker — Frontend Design Specification
**Apple Premium Design Philosophy + UX Laws Applied**

---

## 1. Design Philosophy

This specification channels Apple's Human Interface Guidelines (HIG) philosophy: **clarity, deference, and depth**. Every design decision should feel earned — nothing decorative for its own sake, everything purposeful.

> *"Design is not just what it looks like and feels like. Design is how it works."*
> — Steve Jobs

### The Three Pillars (Apple HIG)

| Pillar | Definition | Applied to Finance Tracker |
|---|---|---|
| **Clarity** | Text is legible, icons precise, ornaments subtle | Numbers read instantly; financial data is never ambiguous |
| **Deference** | UI recedes, content leads | Money is the hero — chrome disappears, figures breathe |
| **Depth** | Layers, motion, and hierarchy create context | Cards float; modals materialize with parallax depth |

---

## 2. Visual Identity

### Color System

```
Primary Background     #F2F2F7   /* Apple systemGroupedBackground */
Secondary Background   #FFFFFF   /* Card surfaces */
Tertiary Background    #EFEFF4   /* Input fields, secondary cards */

Primary Label          #1C1C1E   /* Main text */
Secondary Label        #3C3C43   /* Supporting text, 60% opacity */
Tertiary Label         #3C3C43   /* Placeholders, 30% opacity */

System Blue            #007AFF   /* Primary CTA, links */
System Green           #34C759   /* Income, positive delta */
System Red             #FF3B30   /* Expenses, negative delta, errors */
System Orange          #FF9500   /* Warnings, budget nearing limit */
System Gray            #8E8E93   /* Disabled states, dividers */

Separator              rgba(60,60,67,0.12)
```

#### Dark Mode Equivalents
```
Primary Background     #1C1C1E
Secondary Background   #2C2C2E
Tertiary Background    #3A3A3C
Primary Label          #FFFFFF
Secondary Label        rgba(235,235,245,0.6)
```

> **UX Law Applied — Aesthetic-Usability Effect:** A polished, consistent color system makes the tracker feel more trustworthy and accurate, even before a user interacts with it.

---

### Typography

Apple uses **SF Pro** as its system typeface. Mirror this with:

- **Display / Hero numbers**: SF Pro Display (or `system-ui` + `-apple-system`), weight 700, tabular figures (`font-variant-numeric: tabular-nums`)
- **Body / Labels**: SF Pro Text, weight 400–500
- **Captions / Metadata**: SF Pro Text, weight 400, 11–13px

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif;
font-variant-numeric: tabular-nums; /* CRITICAL for financial data */
```

#### Type Scale

| Role | Size | Weight | Line Height |
|---|---|---|---|
| Large Title | 34px | 700 | 41px |
| Title 1 | 28px | 700 | 34px |
| Title 2 | 22px | 700 | 28px |
| Title 3 | 20px | 600 | 24px |
| Headline | 17px | 600 | 22px |
| Body | 17px | 400 | 22px |
| Callout | 16px | 400 | 21px |
| Subhead | 15px | 400 | 20px |
| Footnote | 13px | 400 | 18px |
| Caption 1 | 12px | 400 | 16px |
| Caption 2 | 11px | 400 | 13px |

> **UX Law Applied — Typography Hierarchy:** A clear type scale guides users through financial summaries → category breakdowns → transaction details without overwhelming working memory.

---

## 3. Spacing & Layout Grid

Apple uses an **8pt base grid** system. Every spacing value should be a multiple of 4 or 8.

```
4px   — Inline gaps between badge and label
8px   — Tight internal card padding
12px  — Default inner card padding (compact)
16px  — Standard content margin
20px  — Card padding (comfortable)
24px  — Section spacing
32px  — Large section separators
44px  — Minimum tap target (Apple HIG requirement)
```

### Safe Areas & Margins

```
Screen horizontal margin:  16px (compact) / 20px (regular)
Card corner radius:        12px (default) / 16px (large cards)
List separator inset:      16px leading
```

> **UX Law Applied — Fitts's Law:** All primary actions (Add Transaction, Filter, Period Selector) must have tap targets ≥ 44×44px. The most-used actions are placed at thumb reach — bottom of screen.

---

## 4. Component Specifications

### 4.1 Summary Card (Hero)

The top-of-screen balance card. This is the emotional peak of every session.

- **Dimensions**: Full-width, 160px height minimum
- **Background**: Solid white OR a subtle gradient (`#FFFFFF` → `#F9F9F9`)
- **Shadow**: `0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)` — Apple's characteristic diffuse shadow
- **Corner Radius**: 16px
- **Balance Display**: 34px, weight 700, tabular-nums, system green/red based on net
- **Period Label**: 13px, secondary label, uppercase tracking `0.04em`

```
┌──────────────────────────────────┐
│  Net Balance          MAY 2026   │
│  ₱ 24,380.00                     │
│  ↑ +₱3,200 from last month       │
│  [Income ₱32k] [Expenses ₱7.6k]  │
└──────────────────────────────────┘
```

> **UX Law Applied — Peak-End Rule:** The balance card is the "peak" moment of the session. Make it delightful and clearly legible — this number is what users will remember.

---

### 4.2 Transaction List Row

```
┌─────────────────────────────────────────────┐
│  [Icon]  Label                   ₱ 1,200.00 │
│          Category · May 25              ▶   │
└─────────────────────────────────────────────┘
```

- **Height**: 60px minimum (comfortable), 44px (compact)
- **Leading icon**: 36×36px, rounded rect (10px radius), category color tint
- **Amount**: Right-aligned, tabular-nums, red for expenses / green for income
- **Separator**: 1px `rgba(60,60,67,0.12)`, inset 16px leading (starts after icon)
- **Swipe actions**: Delete (red, system), Edit (system blue) — follow iOS swipe pattern

> **UX Law Applied — Law of Proximity:** Icon + label + category are tightly grouped (8px gap). Amount is right-aligned, creating clear left→right: *what it is* → *how much*.

---

### 4.3 Category Pill / Badge

```css
border-radius: 100px;
padding: 4px 10px;
font-size: 12px;
font-weight: 500;
background: rgba(var(--category-rgb), 0.12);
color: rgb(var(--category-rgb));
```

Categories use Apple's semantic colors: Food → Orange, Transport → Blue, Health → Green, etc.

---

### 4.4 Input Fields

Follow Apple's **inset grouped list** style:

```
┌─────────────────────────────────┐
│  Amount                         │
│  ┌───────────────────────────┐  │
│  │  ₱  0.00                  │  │
│  └───────────────────────────┘  │
│  Category                       │
│  ┌───────────────────────────┐  │
│  │  Food & Dining          ▾ │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

- Background: `#EFEFF4` (tertiary grouped background)
- Border: none by default; `2px solid #007AFF` on focus
- Corner radius: 10px
- Minimum height: 44px
- Label: 15px subhead, secondary label, sits above field

> **UX Law Applied — Hick's Law:** Category selection must use a picker/dropdown — not a flat grid of 20 icons. Reduce choice complexity at point of entry.

---

### 4.5 Charts & Data Visualization

- **Donut chart** (spending by category): Thin ring (8px stroke), pastel fills, center label showing total
- **Bar chart** (monthly trend): Rounded top corners (`border-radius: 4px`), 80% opacity fill, animated on load
- **Sparkline** (7-day mini trend): 1.5px stroke, no fill, system blue, inside the summary card

```
Chart entry animation: bars grow from 0 upward, 300ms, ease-out-cubic
Donut: rotate from 0°, 500ms, ease-in-out, staggered per segment (50ms delay each)
```

> **UX Law Applied — Goal-Gradient Effect:** Progress bars toward budget limits should visually "fill" — users accelerate awareness as they approach their budget cap.

---

## 5. Motion & Animation

Apple's motion philosophy: **purposeful, not decorative**. Every animation communicates state, not style.

### Timing Functions

```css
--ease-apple-standard: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-apple-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1.0);
--ease-apple-spring: cubic-bezier(0.34, 1.56, 0.64, 1.0);
```

### Motion Tokens

| Interaction | Duration | Easing |
|---|---|---|
| Button press / tap feedback | 100ms | ease-standard |
| Card expand / sheet present | 300ms | ease-decelerate |
| List row insert | 250ms | ease-spring |
| Page transition | 350ms | ease-decelerate |
| Number value change | 400ms | ease-standard |
| Chart load | 500ms | ease-decelerate |
| Modal dismiss | 200ms | ease-accelerate |

> **UX Law Applied — Doherty Threshold:** All feedback (tap states, loading indicators) must respond within 400ms. Any operation longer than 400ms should show a skeleton loader or progress indicator — never leave the user waiting in silence.

---

## 6. Interaction Patterns

### Navigation Model

Follow Apple's **hierarchical navigation**:

```
Tab Bar (bottom)
├── Dashboard (Home)       — Overview, summary card, recent transactions
├── Transactions           — Full list, search, filter, sort
├── Budget                 — Category limits, progress rings
├── Reports                — Charts, trends, export
└── Settings               — Currency, categories, notifications
```

Tab bar: 49px height, SF Symbols icons, system blue active tint.

### Bottom Sheet / Modal

- Add Transaction → bottom sheet slides up (300ms, spring easing)
- Full-screen edit: push navigation
- Destructive actions: always confirm via **Action Sheet** (never silent delete)

### Swipe & Gesture

- Pull-to-refresh on transaction list
- Swipe left to reveal Delete / Edit on rows
- Long-press on chart segment → tooltip with exact values

---

## 7. UX Laws — Applied Master Reference

| Law | Application in Finance Tracker |
|---|---|
| **Aesthetic-Usability Effect** | A refined Apple aesthetic builds implicit trust in financial data |
| **Hick's Law** | Limit add-transaction form to ≤5 required fields; hide advanced options |
| **Fitts's Law** | Primary CTA (+ Add) is full-width or bottom-right FAB, ≥44px |
| **Miller's Law** | Dashboard shows max 5–7 recent transactions before "See All" |
| **Peak-End Rule** | Balance card and budget completion are the emotional peaks — make them beautiful |
| **Doherty Threshold** | Skeleton screens for lists; immediate tap feedback (<100ms visual) |
| **Goal-Gradient Effect** | Budget progress bars accelerate toward limit visually (color shifts orange → red) |
| **Von Restorff Effect** | High-spend outlier transactions get a subtle highlight or badge |
| **Zeigarnik Effect** | Incomplete budget setup or missing categories surface a persistent nudge card |
| **Law of Proximity** | Amount / category / date are visually grouped; meta always below primary label |
| **Serial Position Effect** | Most important categories are pinned first and last in lists |
| **Chunking** | Group transactions by day, week, or category — never a raw flat list |
| **Occam's Razor** | Default view shows only what matters: net balance, top 3 categories, recent activity |
| **Jakob's Law** | Bottom tab nav, swipe gestures, pull-to-refresh — match system conventions |

---

## 8. Accessibility (Apple Standard)

- **Dynamic Type**: All font sizes respond to user's system text size preference
- **Color is never the only indicator**: Income/expense also differentiated by +/− prefix and icons
- **Contrast ratio**: Minimum 4.5:1 for normal text (WCAG AA), 7:1 for financial figures (AAA)
- **Reduce Motion**: Respect `prefers-reduced-motion`; substitute fade for slide/spring animations
- **VoiceOver labels**: Every icon has an `aria-label`; amounts read as "Positive 1,200 pesos" or "Expense 350 pesos"

---

## 9. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use tabular-nums for all amounts | Let numbers shift width as they change |
| Animate value changes smoothly | Flash or jump numbers |
| Use semantic Apple system colors | Invent arbitrary brand colors for states |
| Group transactions by date chunk | Display a flat, unsorted raw list |
| Show skeleton loaders | Show blank white screens while loading |
| Confirm all destructive actions | Silently delete a transaction |
| Keep forms ≤5 visible fields | Dump a 12-field form on one screen |
| Match iOS swipe / gesture conventions | Invent unfamiliar gesture patterns |

---

## 10. File & Asset Conventions

```
/assets
  /icons          SF Symbol equivalents (SVG)
  /illustrations  Empty state illustrations (minimal line art)
  /fonts          SF Pro fallbacks if custom font loaded

Naming: kebab-case
  icon-add-transaction.svg
  icon-category-food.svg
  empty-state-no-transactions.svg
```

---

*Specification version 1.0 — Finance Tracker Frontend*
*Authored for Apollo · May 2026*
