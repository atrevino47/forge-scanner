# Stitch Redesign Prompt: Admin Dashboard (/admin)

## Page Purpose
Internal command center for the Forge team. Used during and between strategy calls to manage leads, track scan activity, initiate payments, and monitor the sales pipeline. This is a tool interface — efficiency and data density matter more than marketing polish, but it should still feel premium.

## Brand System — Dark Mode (Tool Interface)
- **Background:** #141413 (dark base)
- **Surface:** #1E1E1C (cards, panels)
- **Card:** #282826 (elevated cards, table rows on hover)
- **Elevated:** #353533 (modals, dropdowns)
- **Accent:** #E8530E (Forge Orange) — CTAs, active states, important indicators
- **Text:** #F0EFE9 (primary), #9A9890 (muted)
- **Border:** rgba(255, 107, 43, 0.12)
- **Fonts:** Same 3 fonts (Outfit, Space Grotesk, JetBrains Mono)
- **Radius:** 8px. Crisp, tool-like.

## Layout
- Full-width, max-width 1120px centered
- Left sidebar (collapsible on mobile): navigation
- Main content area: ~880px

## Sidebar Navigation
- bg #1E1E1C, width ~220px, full viewport height
- Logo: "FORGE" in Outfit weight 900, small, top-left
- Nav items: icon + label, font-body text-sm
  - Dashboard (grid icon) — active: orange text + left border
  - Leads (users icon)
  - Scans (search icon)
  - Payments (credit-card icon)
  - Settings (gear icon)
- Bottom: team member avatar + name, logout link
- Mobile: hamburger-triggered slide-out

## Top Bar
- Inside main content area
- Left: Page title (Outfit weight 700, text-2xl)
- Right: Search input (small, rounded, bg #282826) + notification bell + "New Scan" button (Forge Orange, small)

---

## Dashboard View (default)

### Metrics Row (4 cards, horizontal)
Each card: bg #1E1E1C, border rgba(255,107,43,0.12), padding 20px
- **Total Leads** — large number (font-display, text-3xl), "+N this week" subtitle in green or orange
- **Active Scans** — count of in-progress scans
- **Calls Booked** — this week/month toggle
- **Revenue** — total payments, font-mono for dollar amount

### Recent Activity Feed
- Vertical timeline, left-aligned
- Each entry: small colored dot (orange=scan, green=booking, blue=payment) + timestamp (font-mono, text-xs, muted) + description (text-sm)
- Examples:
  - "New scan started for acmecorp.com" (orange dot)
  - "John Smith booked a strategy call" (green dot)
  - "Payment received: $2,500 setup fee" (blue dot)
  - "Follow-up email sent to jane@example.com" (orange dot)
- Max 10 entries, "View all" link at bottom

### Pipeline Summary
- Horizontal funnel visualization
- Stages: Scanned > Email Captured > Blueprint Generated > Chat Engaged > Call Booked > Payment Made
- Each stage: count + percentage conversion from previous
- Bar chart or connected nodes with counts
- Clicking a stage filters the leads table to that stage

---

## Leads View

### Filters Bar
- Horizontal row of filter pills
- Status: All / Email Captured / Blueprint Viewed / Chat Active / Call Booked / Paid / No Email
- Date range picker (last 7d / 30d / 90d / custom)
- Search: by email, phone, URL, business name
- Sort: newest first (default), score, status

### Leads Table
- bg #1E1E1C for table container
- Header row: bg #282826, font-mono text-[10px] uppercase tracking-widest, color #9A9890
- Columns:
  - **Lead** — business name or URL (truncated), email below in muted
  - **Status** — colored badge (scanning/completed/booked/paid)
  - **Score** — overall health score, color-coded (red < 40, orange 40-70, green > 70)
  - **Captured** — email icon (green if yes, gray if no) + phone icon
  - **Scans** — count
  - **Last Activity** — relative timestamp (font-mono, text-xs)
  - **Actions** — "View" link, "..." menu (payment, notes, archive)
- Row hover: bg #282826
- Row click: navigates to /admin/scan/[id] for their latest scan
- Pagination: bottom-right, 25 per page

### Empty State
- Centered icon + "No leads yet"
- "Share your scanner URL to start generating leads"
- Copy-to-clipboard button for audit.forgedigital.com

---

## Scans View

### Scans Table
Similar to leads table but scan-focused:
- Columns: URL, Status (scanning/analyzing/completed/failed), Stages (5 dots showing completion), Score, Lead (linked), Created, Duration
- Failed scans highlighted with subtle red border
- "Retry" action for failed scans

---

## Payments View

### Payment Summary Cards (3)
- **Total Revenue** — big number, month-to-date
- **Pending** — invoices sent but not paid
- **This Month** — compared to last month (up/down arrow + percentage)

### Payments Table
- Columns: Date, Lead (name/email), Amount (font-mono, green), Type (setup/retainer/custom), Status (completed/pending/failed/refunded), Stripe ID
- Status badges: green (completed), orange (pending), red (failed), gray (refunded)
- Click row: opens Stripe dashboard link

### "New Payment" Button
- Opens modal: select lead (search), amount, type, description
- Creates Stripe PaymentIntent
- Sends payment link to lead's email

---

## Animation Notes
- Page transitions: subtle fadeSlideUp on content area change
- Table rows: stagger fadeIn on initial load
- Metric cards: scaleIn on load
- Keep animations minimal — this is a tool, speed matters
- No scroll-triggered animations in admin (instant load)

## Mobile Considerations
- Sidebar collapses to hamburger
- Tables become card lists on mobile (each row = a card)
- Metric cards: 2x2 grid instead of horizontal
- Filters: collapsible accordion
- Fixed bottom bar with key actions (New Scan, New Payment)
