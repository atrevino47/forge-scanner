# Stitch Redesign Prompt: Admin Scan Detail (/admin/scan/[id])

## Page Purpose
Team view of a specific scan — used during live strategy calls with the lead. Adrián shares this screen while on a call, walks through the findings, and can initiate a Stripe payment directly from this page. Must display data clearly, support live presentation, and enable one-click payment flow.

## Brand System — Dark Mode (same as admin dashboard)
- Same dark palette as /admin
- Exception: scan findings and screenshots use light card backgrounds (#FAFAF7) for readability during screen share

## Layout
- Two-column on desktop: left (scan data, ~60%) + right (actions panel, ~40%)
- Stacks on mobile: data first, actions below
- Max-width 1120px centered
- Sidebar navigation same as /admin (shared layout)

---

## Top Section

### Back Navigation
- "< Back to Leads" — text link, muted, top-left

### Lead Header Card
- bg #1E1E1C, rounded-xl, padding 24px
- Left: Business name (Outfit weight 700, text-2xl, white) + website URL (font-mono, text-sm, muted, clickable)
- Right: Overall health score (large, color-coded badge)
- Below: Contact info row — Email (clickable mailto), Phone (clickable tel), Social handles (linked icons)
- Status badges: scan status, email captured, blueprint generated, call booked, payment made

---

## Left Column: Scan Data

### Stage Navigation
- Horizontal tabs matching the public results page stages:
  - Traffic Sources, Landing Experience, Lead Capture, Offer & Conversion, Follow-Up System
- Active: Forge Orange underline + white text
- Inactive: muted text
- Each tab shows a dot indicator: green (strong), orange (moderate), red (weak), gray (not found)

### Stage Content (per selected stage)

**Score + Summary**
- Score badge: large number + severity label
- AI headline summary in a card

**Screenshots**
- All screenshots for this stage (not just primary — show desktop AND mobile)
- Each in a light-mode card (#FAFAF7) for readability during screen share
- Browser chrome mockup (same as public page)
- Scrollable viewport (max-height 400px)
- Annotation dots visible and clickable
- Click dot: popover shows finding detail

**Findings List**
- Same card-based findings as public page, but with additional team-only fields:
  - "Forge Fix" column — what Forge would do to fix this (brief, for call talking points)
  - Impact estimate — "High / Medium / Low" badge
  - Checkbox: "Discussed on call" (for tracking)

### Blueprint Section (if generated)
- Funnel map + mockup embedded below stages
- Same as public view but with "Copy mockup link" action for follow-up emails

### Conversation History
- Collapsible section: "AI Sales Agent Conversation"
- Shows all messages across all channels (web, email, SMS, WhatsApp)
- Each message: channel badge (color-coded) + timestamp + role (assistant/user) + content
- Delivery/open/click indicators per message
- Useful for call prep: "I see you chatted with our AI about your Instagram..."

---

## Right Column: Actions Panel (sticky on scroll)

### Quick Actions Card
- bg #1E1E1C, rounded-xl, padding 20px
- Stacked buttons, full-width:
  1. **"Start Payment"** — Forge Orange, primary. Opens payment modal.
  2. **"Book Follow-up"** — outlined, opens Cal.com with pre-fill
  3. **"Send Results Email"** — outlined, sends scan results link to lead's email
  4. **"Copy Scan Link"** — outlined, copies public /scan/[id] URL

### Payment Modal (triggered by "Start Payment")
- Overlay modal, bg #282826, rounded-xl
- Fields:
  - **Amount** — number input, large font-mono, dollar prefix
  - **Type** — dropdown: Setup Fee / Monthly Retainer / Custom Package
  - **Description** — text input, optional ("Landing page redesign + Instagram strategy")
- Preview: "Charge $2,500.00 to john@acmecorp.com"
- **"Create Payment Link"** — sends Stripe payment link via email
- **"Process Payment Now"** — Stripe Elements inline (for card-on-file or live card entry)
- Confirmation: green checkmark animation + receipt sent notification

### Payment History (below quick actions)
- List of past payments for this lead
- Each: date, amount (font-mono, green), type, status badge
- Click: opens in Stripe dashboard

### Call Notes
- Expandable text area
- Auto-saves on blur
- Timestamp of last edit
- Placeholder: "Add call prep notes or post-call summary..."
- Markdown supported

### Lead Timeline
- Compact vertical timeline of all interactions:
  - Scan started
  - Email captured
  - Blueprint generated
  - Chat messages sent/received
  - Follow-up emails sent (with open/click status)
  - Call booked
  - Payment made
- Each entry: small dot + timestamp (font-mono, text-xs) + description
- Newest first

---

## Screen Share Considerations
- Light-mode cards for screenshots ensure readability on projectors/screenshare
- Large text for scores and headlines — visible from across a desk
- Clean layout without clutter — professional impression during calls
- Payment flow is fast: 2 clicks to send a payment link
- Notes field visible so Adrián can reference talking points during the call

## Animation Notes
- Minimal — this is a working tool, not a marketing page
- Page load: subtle fadeIn on content blocks
- Payment modal: scaleIn entrance
- Timeline entries: no animation (instant render)
- Tab switching: instant content swap, no transition

## Mobile Considerations
- Actions panel moves below scan data
- Quick actions become a fixed bottom bar with icon buttons
- Payment modal: full-screen on mobile
- Screenshots: full-width, same scrollable viewport
- Notes: expandable card at bottom
