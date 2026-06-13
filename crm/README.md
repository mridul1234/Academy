# ChessGum CRM

Coach and student CRM workspace for ChessGum.

The CRM uses the same Supabase project as the internal dashboard, but it reads its own CRM tables:

- `crm_students`
- `crm_site_metrics`
- `crm_curriculum_placements`

Run `supabase/crm-standalone.sql` once in the Supabase SQL editor to create those tables and copy the current dashboard students/schedule into them.

## Deploy on Vercel

Create a standalone Vercel project for the CRM with these settings:

```text
Root Directory: crm
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

## Run locally

```bash
npm install
npm run dev
```

The CRM runs on `http://localhost:3002` by default.

## Zoom API setup

Create a Zoom Server-to-Server OAuth app in the Zoom App Marketplace and add the meeting create scope for your account. Then set these values in `.env.local`:

```bash
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=
ZOOM_USER_ID=me
```

Use `ZOOM_USER_ID=me` for the account owner, or set it to the host user's Zoom user ID/email if needed. The CRM `Start Zoom` button creates a 45-minute scheduled Zoom meeting and redirects the coach to the host start URL.
