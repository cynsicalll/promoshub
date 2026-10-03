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
