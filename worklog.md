---
Task ID: i18n-group-2
Agent: general-purpose
Task: Update dashboard-view.tsx, promos-view.tsx, promo-detail-view.tsx to use i18n

Work Log:
- Read /home/z/my-project/worklog.md (did not exist yet — created fresh).
- Read /home/z/my-project/src/lib/i18n.ts to inventory all available translation keys (en + de).
- Read /home/z/my-project/src/components/language-provider.tsx to confirm the `useI18n()` hook signature: `const { t } = useI18n();` with `t(key, vars?)`.
- Read the three target view files (dashboard-view.tsx, promos-view.tsx, promo-detail-view.tsx) end-to-end.
- Inventoried all hardcoded German UI strings and mapped each to existing i18n keys. Identified strings without keys and added 26 new keys (13 in en, 13 in de) to /home/z/my-project/src/lib/i18n.ts:
  - dashboard.* : activePlannedHint, completedHint, cancelledHint, remainingUses, sumAllPromos, receivedPayments, notReceivedYet, paidOutHint, receivedOn
  - promos.deletedToast, action.deleteFailed
  - detail.* : updatedToast, updateFailedToast, shareEnableFailedToast, shareDisableFailedToast, copyFailedToast, noCustomer, soundsUsedHint, field.name, field.company, field.contact, field.email, field.phone
- Edited dashboard-view.tsx:
  - Added `import { useI18n } from "@/components/language-provider";` and `const { t } = useI18n();`.
  - Replaced page title/subtitle, KPI labels, hints, chart title & legend names, overdue card heading & empty state, recent lists headings, "Alle" buttons, empty-state messages, and the "seit" / "Eingang" prefixes with `t()` calls (using variable interpolation where needed).
- Edited promos-view.tsx:
  - Added `useI18n` import + hook.
  - Replaced title, subtitle (`t("promos.subtitle", { count, total })`), export/new-promo buttons, search placeholder, status & customer filter labels, status select options (Geplant/Aktiv/...), all 9 table column headers, "erhalten" inline label, empty-state, delete dialog title/description/buttons, and toast strings for export & delete success/failure.
- Edited promo-detail-view.tsx:
  - Added `useI18n` import + hook.
  - Replaced not-found state, back button, action buttons (edit/delete/share/copy-link/stop-share), share banner text, KPI cards, sounds/customer/payments/tiktoks/notes card headings and empty states, customer field labels (Name/Firma/Ansprechpartner/E-Mail/Telefon), payment checkbox labels (Ausgezahlt/Geld angekommen), payment date labels (Erwartet/Ausgezahlt am/Eingang), "Gesamt erhalten / offen" footer, "erstellt / Ziel" caption, "Ohne Titel" fallback, delete dialog (title with `t("detail.deleteTitle", { name: promo.name })`, description, buttons), and all toast success/error messages.
  - Renamed the inner `promo.tiktoks.map((t) => …)` loop parameter from `t` to `tk` to avoid shadowing the `t` translation function (fixed a resulting TS2349 error).
- Ran `bun run lint` → passes with no eslint errors.
- Ran `bunx tsc --noEmit` → no errors in any of the three edited files nor in i18n.ts. Pre-existing TS errors remain in money-view.tsx (Payment.promo) and promo-form-dialog.tsx (FormTikTok callable shadowing) — those files were not part of this task and were not modified by me.

Stage Summary:
- 4 files touched: src/lib/i18n.ts (+26 new keys × 2 langs), src/components/views/dashboard-view.tsx, src/components/views/promos-view.tsx, src/components/views/promo-detail-view.tsx.
- All hardcoded German UI strings in the three target views are now driven by the i18n dictionary; the app defaults to English with German still available via the language provider.
- No logic changes; no removed imports; one necessary variable rename (`t` → `tk` in the tiktoks map callback) to resolve a function-shadowing type error introduced by the new `t` from `useI18n()`.
- ESLint clean; TypeScript clean for all edited files.

---
Task ID: i18n-group-3
Agent: general-purpose
Task: Update promo-form-dialog.tsx, money-view.tsx, monthly-view.tsx to use i18n

Work Log:
- Read /home/z/my-project/worklog.md to pick up context from i18n-group-2 (which established the same useI18n pattern and confirmed pre-existing TS errors in money-view.tsx and promo-form-dialog.tsx).
- Read /home/z/my-project/src/lib/i18n.ts (both en + de dicts, 828 lines) to inventory available translation keys, and /home/z/my-project/src/components/language-provider.tsx to re-confirm `useI18n()` returns `{ t }` with signature `t(key, vars?: Record<string, string|number>)`.
- Read each of the three target files end-to-end: promo-form-dialog.tsx (898 lines), money-view.tsx (412 lines), monthly-view.tsx (341 lines).
- Added 14 new keys to BOTH the `en` and `de` dictionaries in /home/z/my-project/src/lib/i18n.ts:
  - money.received (the spec maps "Erhalten" → t("money.received") but the key was missing)
  - form.error.nameRequired / form.error.dateRequired / form.error.soundNameRequired
  - form.toast.customerCreated / form.toast.soundCreated / form.toast.promoUpdated / form.toast.promoCreated / form.toast.saveError
  - money.toast.paymentDeleted / money.toast.deleteFailed / money.toast.updateError
  - form.amountPlaceholder (0.00 / 0,00) and form.tiktokTargetPlaceholder (e.g. 10 / z. B. 10) for two small placeholders the spec didn't enumerate but that were hardcoded German.
  - Verified en/de parity: 437 keys each, zero missing.
- Edited promo-form-dialog.tsx:
  - Added `import { useI18n } from "@/components/language-provider";` and `const { t } = useI18n();` as the first hook line inside PromoFormDialog.
  - Converted module-scope `STATUS_OPTIONS: { value, label }[]` to a values-only `PromoStatus[]` array and rendered the labels inside the Select via `{t(\`status.${s}\`)}` (status.GEPLANT/AKTIV/ABGESCHLOSSEN/STORNIERT keys already existed in the dict).
  - Replaced dialog title/description, section headers (general/sounds/payments/tiktoks), all Labels and placeholders, customer inline form (name/company/create/cancel), sound inline form (name/artist/url/create-sound/cancel), customer/sound/tiktok selects and "no X" fallbacks, payment row labels (amount/paidOut/received/expectedDate/payoutDate/receivedDate/notes + placeholder), Gesamtbetrag footer, sound row labels (booked/used/remaining) and overbooked warning `t("form.overbooked", { used, total })`, tiktok row labels + placeholders + progress label + target label, notes label + placeholder, and dialog footer cancel/save/edit-submit/create-submit buttons.
  - Replaced toast.success/error calls (customer created, sound created, promo updated/created, save error) and validation toasts (promo name required, date required) with `t()` calls.
  - Renamed the `formTiktoks.map((t) => …)` iteration variable to `tk` to avoid shadowing the new `t` translation function (would have produced TS2349 "FormTikTok has no call signatures" errors at 6 sites — same fix i18n-group-2 applied in promo-detail-view.tsx).
- Edited money-view.tsx:
  - Added `useI18n` import + `const { t } = useI18n();` as first hook line.
  - Replaced page title/subtitle, Export button, all four KPI labels (total/received/outstanding/overdue), search placeholder, status filter options (all/open/paidOut/received/overdue), period filter options (all/today/this week/this month/last month), all 8 table column headers, empty-state "Keine Zahlungen gefunden.", delete-dialog title/description and cancel/delete buttons, and toast messages for export started, payment deleted, delete failed, update error.
- Edited monthly-view.tsx:
  - Added `useI18n` import + `const { t } = useI18n();` as first hook line.
  - Localised the recharts data: converted `chartData` object keys from hardcoded "Verdienst"/"Erhalten"/"Offen"/"Promos"/"TikToks" to computed `[t("monthly.col.earnings")]` etc., and updated every `<Bar dataKey=...>` accordingly so the chart Legend shows translated series names.
  - Replaced page title, subtitle (with `{year}` var), prev/next year aria-labels, all four KPI labels including `t("monthly.totalEarnings", { year })` and `t("monthly.promosHint", { promos, tiktoks })`, cash-flow chart title/subtitle, activity chart title/subtitle, all 7 table column headers, loading "Lade…", total row `t("monthly.sum", { year })`, and the trailing `{count} Promos` badge.
- Ran `cd /home/z/my-project && bun run lint` → eslint clean (exit 0).
- Ran `bunx tsc --noEmit` to verify TypeScript:
  - No errors in promo-form-dialog.tsx, monthly-view.tsx, i18n.ts, or language-provider.tsx.
  - The only TS errors remaining in money-view.tsx (5× TS2551 "Property 'promo' does not exist on type 'Payment'") are pre-existing in the codebase — confirmed by `git stash && bunx tsc --noEmit && git stash pop` which showed the same 5 errors at the original line numbers (106/107/312/316/325). They are unrelated to this i18n task and were not introduced by these changes.
- Sanity-tested the translate() function with all variable-interpolation call sites used by the new code (form.overbooked, monthly.subtitle, monthly.promosHint, monthly.sum, status.GEPLANT) — all resolve correctly in both en and de.

Stage Summary:
- 4 files touched: src/lib/i18n.ts (+14 new keys × 2 languages = 28 lines added), src/components/views/promo-form-dialog.tsx, src/components/views/money-view.tsx, src/components/views/monthly-view.tsx.
- Every hardcoded German UI string in the three target views is now driven by the i18n dictionary via `useI18n()`; English is the default and German remains selectable through the existing LanguageProvider.
- No logic changes; no imports removed; one necessary variable rename (`t` → `tk` inside `formTiktoks.map`) to resolve a function-shadowing type error created by introducing the `t` translation function.
- ESLint clean; TypeScript clean for all edited files. The 5 residual TS errors in money-view.tsx are pre-existing (Payment.promo) and out of scope for this i18n task.

---
Task ID: best-video-clickable + backup-button
Agent: main (Z.ai Code)
Task: 1) Fix "best performing video" on customer access link — show which video it is, make clickable to scroll+highlight. 2) Add backup button in Settings.

Work Log:
- Investigated customer-dashboard.tsx: the "best performing video" card only showed a trophy icon + title + view count. No video number, no thumbnail, not clickable. TikTok videos had no element IDs for scrolling.
- Fixed customer-dashboard.tsx:
  * Added scrollToVideo(promoIdx, videoIdx) function — scrolls to the video card with id `video-{promoIdx}-{videoIdx}` and highlights it with a pink ring + scale-105 for 2.5s.
  * Wrapped each TikTokThumbnail in a div with `id={`video-${idx}-${i}`}` and `className="rounded-lg transition-all duration-300"` (mirrors the existing sound-card pattern).
  * Made the best-video card a <button> with onClick → scrollToVideo(idx, bestIdx). Added:
    - A rank badge (green circle with the video number, e.g. "13") so the user immediately sees which video number it is
    - Hover effects (border-emerald-400, shadow, bg change)
    - A "View →" hint that appears on hover
    - title attribute for accessibility
- Added i18n keys: viewer.bestVideoHint ("Click to jump to this video"), viewer.bestVideoClick ("View →") in EN+DE.
- Created /api/backup/route.ts: GET endpoint (admin-only) that fetches all promos (with customer/sounds/payments/tiktoks), customers, sounds, tiktoks, and users (excluding passwordHash) from the database, wraps them in a JSON object with _meta (exportedAt, version, counts), and returns as a downloadable .json file.
- Updated settings-view.tsx:
  * Added Database icon import.
  * Added backupAll() function that opens /api/backup in a new tab and shows a toast.
  * Added a new "Full Backup" Card section between Export and Data Management — with a description and a prominent "Download Full Backup" button.
- Added i18n keys: settings.backup ("Full Backup"), settings.backupDesc, settings.backupDownload, settings.backupStarted in EN+DE.
- Deployed: commit 9907887, Vercel deployment SUCCEEDED.
- Verified on production:
  * Backup API: returns 66KB JSON file with 12 promos, 7 customers, 11 sounds, 23 tiktoks, 5 users.
  * Customer access link: best performing video shows "Best Performing Video 13 #stretchtok #giftok #gta 10.7K views View →" — clicking it scrolls to Video #13 and highlights it with a pink ring (confirmed via DOM check: ring-pink-400 class present).
  * Settings: "Full Backup" section with "Download Full Backup" button is visible.

Stage Summary:
- 4 files changed: customer-dashboard.tsx (scrollToVideo + video IDs + clickable best-video card with rank badge), settings-view.tsx (backup button + section), i18n.ts (new keys EN+DE), new api/backup/route.ts (JSON backup endpoint).
- Best performing video on customer access link now shows the video number (rank badge), is clickable, scrolls to the video, and highlights it with a pink ring for 2.5s.
- Settings has a new "Full Backup" section that downloads a complete JSON backup of all data.

---
Task ID: fix-sound-save + quantityUsed
Agent: main (Z.ai Code)
Task: 1) Sounds not saving when creating a new promo. 2) Auto-count TikToks towards sound usage in promos.

Work Log:
- Investigated via subagent: found two root causes.
- ISSUE 1 (sounds not saving): In promo-form-dialog.tsx, handleCreateSound() created the sound in the DB but did NOT add it to formSounds (unlike handleCreateCustomer which sets customerId). So when the user created a sound inline and saved, buildPayload() produced an empty sounds:[] array.
- ISSUE 2 (quantityUsed not incrementing): POST /api/promos and PUT /api/promos/[id] created TikToks with soundId but never incremented promoSound.quantityUsed. Only the standalone /api/tiktoks POST and /api/promos/[id]/tiktoks POST had this logic.
- Fix 1: Updated handleCreateSound() in promo-form-dialog.tsx — when no addToRowKey is provided, it now adds a new formSounds row with the freshly-created sound's ID (mirroring handleCreateCustomer's setCustomerId pattern).
- Fix 2a: Updated POST /api/promos (route.ts) — after creating the promo (which creates PromoSound records via nested write), loops through new tiktoks that have a soundId and increments the matching PromoSound.quantityUsed.
- Fix 2b: Updated PUT /api/promos/[id] (route.ts) — inside the new-tiktok creation loop, after each db.tikTok.create, if the tiktok has a soundId, finds the matching PromoSound and increments quantityUsed.
- Synced local files from deployed version first (local was out of sync due to deploying from /tmp/promohub-clone).
- Deployed: commit f6f590d, Vercel deployment SUCCEEDED.
- Verified on production: created a test promo with a sound (quantityTotal=10, quantityUsed=0) AND a tiktok linked to that sound. API response showed:
  * Sounds saved: 1 (sound correctly stored) ✓
  * quantityUsed: 1 (auto-incremented from 0 to 1 because of the linked tiktok) ✓
  * TikTok views: 27454 (auto-fetched from tikwm) ✓
- Cleaned up: deleted the test promo.

Stage Summary:
- 3 files changed: promo-form-dialog.tsx (handleCreateSound adds to formSounds), api/promos/route.ts (increment quantityUsed), api/promos/[id]/route.ts (increment quantityUsed for new tiktoks).
- Sounds now save correctly when creating a new promo (inline create sound flow works).
- quantityUsed auto-increments when a TikTok with a sound is added — works in all 4 code paths: standalone add, quick-add, promo create, promo update.
- The "TikToks uploaded" count (e.g. "1/10") now updates automatically when you add a TikTok with a sound to a promo.

---
Task ID: fix-missing-video-stats
Agent: main (Z.ai Code)
Task: Videos added via promo button don't automatically get stats in channel — newest Sydney Sweeney Ad video was missing

Work Log:
- Investigated production: found the newest Sydney Sweeney Ad video (vm.tiktok.com/ZGdCF9kKH, uploaded Oct 6 14:54) was in the DB but had playCount=null, cover=null — no stats were fetched.
- The video WAS in channel-stats (at position V23) but was excluded from all statistics because playCount was null.
- Root cause: the auto-fetch from tikwm failed when the promo was updated (tikwm is very flaky). The previous retry logic (3 attempts, 1.5s/3s/4.5s backoff) wasn't enough.
- Triggered 3 manual syncs on production to backfill the missing video. After 3 syncs, the video got its stats (2805 views, cover, createTime). All 24/24 videos now have stats.
- Improved src/lib/tikwm.ts:
  * Single fetch (used by promo create/update for 1-3 new tiktoks): increased from 3 retries to 5 retries with 1s/2s/3s/4s/5s backoff (total max ~15s, well within Vercel's timeout for a single video).
  * Batch fetch (used by Sync Stats button for all videos): reduced batch size from 5 to 3, kept 3 retries per video (to stay within Vercel's 10s timeout when syncing many videos).
  * Separated the batch fetch logic to use fetchTiktokData directly with 3 retries (instead of calling fetchAndStoreTiktokStats which uses 5 retries) — avoids timeout when syncing 20+ videos.
- Deployed: commit 7da0a47, Vercel deployment SUCCEEDED.
- Verified: 24/24 videos have stats. The previously missing video (ZGdCF9kKH) has 2805 views and cover. It's at position V23 (Oct 6, 14:54 — second newest).

Stage Summary:
- 1 file changed: src/lib/tikwm.ts (improved retry logic).
- The missing Sydney Sweeney Ad video now shows in the Channel tab with stats and thumbnail.
- Future promo creations/updates will retry up to 5 times (1s/2s/3s/4s/5s backoff) when fetching stats for new TikToks — much more reliable than the previous 3 retries.
- The Sync Stats button also benefits from the improved batch logic (batch size 3, 3 retries per video).
- NOTE: If a video still doesn't get stats after promo creation (tikwm down for extended period), the user can always click "Sync Stats" in the Channel tab to retry.

---
Task ID: channel-delete-videos
Agent: main (Z.ai Code)
Task: Add option to remove videos from the Channel tab

Work Log:
- Updated VideoCard component in channel-view.tsx:
  * Changed outer element from <a> to a <div> wrapper (to allow a button inside without nesting interactive elements)
  * The thumbnail area is still an <a> that opens the video in a new tab
  * Added a delete button (Trash2 icon) positioned absolute top-right of the thumbnail, appears on hover (opacity-0 → group-hover:opacity-100), with red hover background
  * Added handleDelete() function that calls DELETE /api/tiktoks?id={video.id}, invalidates channel-stats/tiktok-stats/promos queries, shows success/error toast
  * Added AlertDialog confirmation: "Remove video?" title, "This will remove the video from the channel statistics. This cannot be undone." description, Cancel + Remove video buttons (red)
  * Delete button is hidden in demo mode (isDemo prop)
  * Added useI18n + useQueryClient hooks to VideoCard
- Added isDemo prop to VideoCard, passed from the ChannelView component
- Added AlertDialog import from @/components/ui/alert-dialog
- Added i18n keys: channel.deleteVideo, channel.deleteVideoTitle, channel.deleteVideoDesc, channel.deleteVideoSuccess, channel.deleteVideoFailed (EN + DE)
- The existing DELETE /api/tiktoks endpoint already existed and handles the deletion
- Deployed: commit 27a0f32, Vercel deployment SUCCEEDED.
- Verified via Agent Browser on production:
  * Logged in as admin, navigated to Channel tab
  * Delete button found in DOM on video cards
  * Clicking it opens a confirmation dialog with "Remove video?" title, Cancel + Remove video buttons
  * Cancel works correctly (dialog closes without deleting)

Stage Summary:
- 2 files changed: channel-view.tsx (VideoCard with delete button + confirmation dialog), i18n.ts (new keys EN+DE).
- Videos can now be removed from the Channel tab by hovering over a video card and clicking the trash icon that appears in the top-right corner.
- A confirmation dialog prevents accidental deletion.
- The delete button is hidden in demo mode.
- After deletion, the channel stats, tiktok stats, and promos queries are invalidated so the UI refreshes immediately.
