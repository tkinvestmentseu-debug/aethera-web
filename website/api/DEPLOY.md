# Aethera Contact Pipeline — Deployment Guide

## What's built

| Component | Status | File |
|-----------|--------|------|
| Contact form (async fetch) | ✅ Ready | index.html |
| Signup modal (async fetch) | ✅ Ready | index.html |
| Autofill dark-mode fix | ✅ Ready | index.html |
| Honeypot anti-spam | ✅ Ready | index.html |
| Loading / success / error states | ✅ Ready | index.html |
| Company + error spans in form | ✅ Ready | index.html |
| Cloudflare Worker endpoint | ✅ Ready | api/worker.js |
| Admin notification email (HTML) | ✅ Ready | worker.js |
| Autoresponder (PL + EN) | ✅ Ready | worker.js |
| Welcome email (PL + EN) | ✅ Ready | worker.js |
| Google Sheets lead saving | ✅ Ready | worker.js |
| Rate limiting (5 req/min/IP) | ✅ Ready | worker.js |
| Wrangler config | ✅ Ready | api/wrangler.toml |

---

## Step 1 — Deploy the Cloudflare Worker

```bash
npm install -g wrangler
cd website/api
wrangler login

# Set secrets (never commit these):
wrangler secret put RESEND_API_KEY
# Paste your Resend API key: re_xxxxxxxxxxxx

# Optional — Google Sheets:
wrangler secret put GOOGLE_SHEETS_ID
# Paste Sheet ID from URL: https://docs.google.com/spreadsheets/d/SHEET_ID/

wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON
# Paste the full JSON content of your service account key file

# Deploy:
wrangler deploy
```

The Worker binds to `aethera.pl/api/*` automatically via the route in `wrangler.toml`.

---

## Step 2 — Get your Resend API key

1. Go to https://resend.com → Dashboard → API Keys
2. Create key with `Send` permission
3. Make sure `aethera.pl` domain is verified (it already is)
4. Paste key as secret above

From address used: `noreply@aethera.pl` and `contact@aethera.pl`

---

## Step 3 — Google Sheets setup (optional)

1. Create a Google Sheet with columns:
   `created_at | name | email | company | subject | message | source | language | user_agent | status`

2. Create a Google Cloud Service Account:
   - IAM & Admin → Service Accounts → Create
   - Download JSON key
   - Share the Sheet with the service account email (Editor)

3. Set secret as above

---

## Step 4 — Lead Panel / CRM structure

### Current data structure (each row in Sheets)
```
created_at   | 2026-04-05 14:22:11 UTC
name         | Anna Kowalska
email        | anna@example.com
company      | (optional)
subject      | Partnership
message      | full message text
source       | contact_form | signup_form
language     | pl | en | de | ...
user_agent   | Mozilla/5.0 ...
status       | new → contacted → qualified → closed
```

### Recommended next steps for lead panel:
- Build a simple Next.js/Remix admin at `admin.aethera.pl` (protected by Cloudflare Access)
- Read from Sheets via the same service account
- Add status column update via PATCH endpoint in Worker

### Future notification hooks (when new lead arrives):
- Slack: `await fetch(SLACK_WEBHOOK, { body: JSON.stringify({ text: '✦ New lead: ...' }) })`
- Telegram: Telegram Bot API sendMessage
- Discord: Discord webhook
- Browser push (future): Service Worker + VAPID keys

Insertion point in worker.js: after `appendToSheets()` call, add webhook triggers.

---

## Step 5 — Future: CAPTCHA

Add Cloudflare Turnstile (no API cost on free tier):
1. Get site key from https://dash.cloudflare.com → Turnstile
2. Add `<div class="cf-turnstile" data-sitekey="SITE_KEY"></div>` before submit button
3. In worker: verify token with `https://challenges.cloudflare.com/turnstile/v0/siteverify`

Insertion point in index.html: before each submit button.

---

## Environment summary

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | **YES** | Resend API key (re_...) |
| `GOOGLE_SHEETS_ID` | optional | Sheet ID from URL |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | optional | Full SA JSON as string |
