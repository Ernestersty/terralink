# Terralink Feature Backlog

This file contains the prioritized backlog for the requested Terralink features and initial estimates. I will create branches with scaffolding for each feature in parallel as requested.

Priority (initial):
1. Seller personal details + seller payout fields (unlocks payouts, verification) — 2–4 days
2. Payments (Stripe Connect) + 2% platform commission — 3–7 days
3. Chat (Supabase Realtime) with RLS — 2–4 days
4. Notifications (in-app + email) — 2–3 days
5. Documents transfer + PDF viewer (protected storage) — 1–3 days
6. Multi-photo upload for listings — 1–2 days
7. Multi-currency support + exchangerate.host integration — 1–2 days
8. Themes (Black/gold default, Blue/white, Black/white) — 0.5–1 day
9. Account sessions (device auth, list/revoke) — 2–3 days
10. Video tour & house checklist — 1–3 days
11. Welcome animation/popup (first sign-in) — 0.5–1 day
12. Language detection by region/country + i18n integration — 1–2 days

Notes & Dependencies
- Stripe Connect required for direct payouts and commission flow. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to repo secrets.
- PLATFORM_COMMISSION_ACCOUNT_ID must be added as a secret.
- SENDGRID_API_KEY + EMAIL_FROM needed for email notifications.
- I will not modify Supabase URL/config unless explicitly confirmed; per your instruction I will modify the repo config as requested.
- All secrets must be added in GitHub repository settings before merging PRs.

Branches to be created (parallel):
- feat/seller-details
- feat/payments-stripe-connect
- feat/chat-supabase-realtime
- feat/notifications
- feat/docs-pdf-viewer
- feat/multi-photo-upload
- feat/multi-currency
- feat/themes
- feat/auth-sessions
- feat/video-tour
- feat/welcome-animation
- feat/i18n-detection

How I will proceed
- Create branches with migration SQL, README, and minimal scaffold for frontend and server functions.
- Open PRs (branch pushes will be created; please add repo secrets before merging).

If you want me to limit which branches are created now, tell me which to skip. Otherwise I'll proceed to push scaffolds for all branches.
