---
title: Known Issues
domain: scanner
status: active
last_reviewed: 2026-04-23
---

# Known Issues

Open bugs, tech debt, gotchas, and future work. The authoritative ticket stream is `docs/fixes/FIX-LOG.md`; this doc is the human-readable map of what's fragile and what's intentional.

## Intentional tradeoffs — do not "fix"

These are deliberate product + engineering decisions. Reversing them without reading the rationale will waste time.

1. **English only.** i18n / next-intl were removed. All scanner UI is American English. Workbooks are the only place with `/es` variants, and those are separate routes.
2. **No self-serve payments.** Stripe is team-initiated only, from `/admin/scan/[id]` during a live strategy call. There is no public checkout route. Prospects never self-serve into a plan.
3. **No auth gate on blueprint.** Email + phone from `POST /api/scan/capture-info` is enough. Google OAuth is a soft "save your results" prompt after the blueprint, not a gate. Gating blueprint generation kills conversion.
4. **Screenshots always complete, even if the lead bounces.** The pipeline finishes regardless of whether the user stayed. Captured assets become outreach ammunition.
5. **UTMs on `scans`, not `leads`.** One lead can have multiple scans; attribution belongs to the scan event, not the identity. Spec said leads, implementation said scans — implementation is correct.
6. **Storage URLs, not object keys, stored in DB.** `screenshots.storage_url` is the full public Supabase URL, not a path. Frontend needs the URL verbatim — computing it per read would be churn.
7. **Anonymous SELECT on scans / funnel_stages / screenshots / blueprints.** RLS allows anon read because the `/scan/:id` URL is itself a capability token (unguessable uuid). Changing this to gated-only would require a new auth flow and kill the shareable-results use case.
8. **AI prompt `[COPY: …]` placeholders.** These appear in `src/lib/prompts/mockup.ts` intentionally — they instruct Sonnet to generate copy in-place. Do not treat as stale placeholder. UI-code copy placeholders were all resolved as of `CLAUDE.md` snapshot.

## Known gaps (carrying over; tracked)

### Capture pipeline

- **Carousels / slider content:** FIX-0012 simplified CSS injection to `opacity + visibility` only. Some sliders still don't render all slides by capture time. Parked — the cost to fully solve (per-site adapters) outweighs the value for the average audit.
- **Long-scroll / below-fold lazy-loaded content:** patient-visitor scroll + idle detection helps but isn't complete. Some product grids under infinite scroll only render the first page.
- **Platform-specific login walls:** Instagram, TikTok profile scrapes work for public profiles only. Login-walled content is out of scope.

### Real-time events

- **`page_discovered` events don't fire.** There's no DB mechanism for transient events that aren't tied to row state. Progress indicator infers from screenshot captures + stage updates instead. Documented in `CLAUDE.md` Known decisions.

### Follow-up

- **Multi-channel beyond email is not wired.** Twilio SMS + WhatsApp code stubs exist (`src/app/api/followup/webhook/sms/route.ts`, `src/app/api/followup/webhook/whatsapp/route.ts`, prompt files in `src/lib/prompts/`), but sending is not connected — `TWILIO_*` / `WHATSAPP_*` env vars are empty in production. Email-only follow-up runs successfully.
- **Contact scraping for exit recovery** (`POST /api/followup/scrape-contact`) currently extracts from website HTML + Google Places. WHOIS / social-bio scraping is stubbed but not wired.
- **Long-term nurture** (`/api/cron/nurture-sender`) — route exists but is not registered in `vercel.json`. Add when the 3-touch sequence has conversion data to justify longer nurture.
- **Resend domain verification in production.** Operational: the sending domain must be verified (DNS) before prod emails go out; currently manual. Any DNS drift breaks sending silently.

### Payments

- **No refund flow.** Refunds are issued manually via Stripe dashboard; not surfaced in `/admin/payments`.
- **No subscription / retainer recurrence.** `product_type = 'monthly_retainer'` exists in the enum + payment row, but recurring billing is not wired. Today it's recorded as a one-off PaymentIntent per month.

### Frontend / UX polish

- **Storytelling experience deferred.** The current `/scan/:id` page is a tabbed dashboard (Overview / Stages / Roadmap) per PLAN-0002. The spec-level storytelling / narrative scroll presentation (per `canon/forge-scanner-spec.md` § 3.3) remains unbuilt.
- **Frontend polish via Stitch redesign (PLAN-0001)** — superseded by PLAN-0002. Future polish passes should proceed from the tabbed dashboard as the baseline.
- **Mobile polish** — responsive works; reduce-motion tested; but some sections (BlueprintView, ChatContainer slide-in) could use a second design pass on < 640 px.

### AI / content

- **Hormozi knowledge base is stub-level.** `src/lib/ai/playbook-loader.ts` + `src/lib/prompts/sales-agent-system.ts` include a framework reference, but the full 6+ hours of Hormozi transcripts haven't been distilled + injected. The sales agent works; it's not yet trained to the depth the spec imagined.
- **Video content analysis** — `src/lib/ai/video-analysis.ts` exists and analyzes when social profile data is available; but the spec vision (viral pattern decomposition + hook taxonomy + best-format scoring) is at MVP level — room to deepen prompts.
- **Annotation precision:** Sonnet occasionally puts an annotation dot in the rough vicinity rather than on the exact element. Acceptable at today's volume; worth a prompt + validation pass when we 10× volume.

### Observability

- **No Sentry / Vercel Observability wired.** Errors surface as `console.error` in Vercel function logs only. See `DEPLOYMENT.md` § Monitoring for the plan.
- **No uptime monitor on `chrome.forgewith.ai`.** Chrome death = every scan stuck in `scanning`. A dead-simple `curl /json/version` check every 60 s would catch this.
- **No PostHog funnel dashboards.** Events are captured; dashboards are not saved in-code. Create one: `scan_started → capture_submitted → blueprint_generated → call_booked → paid`.

### Security

- **`/api/test-screenshot` routes are dev-only but live.** Not rate-limited, not auth-gated. Feature-flag off or remove before the next security review.
- **Admin auth is email allowlist only.** No 2FA on top of OAuth. Acceptable for a one-person admin today.
- **Rate limit table grows unboundedly.** No TTL / purge job. Disaster checklist in `DEPLOYMENT.md` covers the cleanup query, but it should be a cron.
- **CSP allows `'unsafe-eval'`.** Needed by some third-party bundles (PostHog historically). Tighten if/when those don't need it.

### Testing

- **No automated test suite.** Verification is `tsc` + `build` + manual smoke. Fragile in the long run. First tests to write, in order:
  1. Contract test: `POST /api/scan/start` → SSE event sequence against a mock browser endpoint.
  2. Pipeline unit test: `runScanAnalysis` orchestrator with fixture screenshots + fake Anthropic client.
  3. DB mapper round-trip: every `mappers.ts` function.

## Fix log snapshot

`docs/fixes/FIX-LOG.md` holds the full list. As of 2026-04-23, FIX-0001 through FIX-0032 are filed; most `verified=yes`; FIX-0010–0012 are `partial` (carousel parking); FIX-0026–0032 are mostly `superseded` by the PLAN-0002 redesign (their underlying components were replaced).

When pulling a fix ticket for work: check its row's `Verified` column + cross-reference with git log — some "superseded" rows were worked on but the component was deleted in the same PR, so the fix landed at a higher level than the ticket described.

## Active plans

`docs/plans/PLAN-LOG.md` currently lists no active plans. Historical:

- PLAN-0001 (Stitch redesign) — superseded by PLAN-0002.
- PLAN-0002 (Results Page Redesign — tabbed dashboard) — resolved.
- PLAN-0003 (Hetzner VPS + polish) — resolved; phase-2 ops work continues in `../../shared/project-logs/forge-scanner.md`.

## Escalation

- Live operational issues → check `../../shared/project-logs/forge-scanner.md`.
- Architecture disagreements → file in `docs/plans/` with the vault-wide Architectural Change Proposal template (see Kova procedures).
- Bugs blocking prospects → file a FIX ticket immediately and ping Adrián on Discord `#builds`.

## Related

- Authoritative ticket stream: `docs/fixes/FIX-LOG.md`
- Audit history: `docs/audits/`
- [AGENTS.md](AGENTS.md) — how fix flow works
- [ARCHITECTURE.md](ARCHITECTURE.md) — where to look in code
- `CLAUDE.md` § Known decisions — the intentional-tradeoff ledger
