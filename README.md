# HOLASKEY

Luxury menswear store for young Nigerian men. It sells ready-made pieces with Paystack checkout and takes custom orders: the customer sends reference photos, the owner sends a quote, and the customer pays it on the site.

**Stack:** Next.js 14 (App Router, TypeScript) · Tailwind CSS · Supabase (Auth, Postgres with RLS, Storage) · Paystack · Resend · Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the keys (see below)
npm run dev                  # http://localhost:3000
```

Without Supabase keys the site still runs. It shows the sample catalogue from `lib/demo.ts`, and accounts, cart and checkout say the store isn't connected yet.

## Set up Supabase

1. Create a project at supabase.com.
2. Run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql` for the sample catalogue. Use the SQL editor, or `supabase db push` with the CLI.
   This creates the tables, Row Level Security on every table, the `products` (public) and `custom-refs` (private) storage buckets with their policies, and the payment and expiry functions.
3. **Auth → Providers:** turn on Email (with "Confirm email") and Google. For Google, add the OAuth client ID and secret from Google Cloud.
4. **Auth → URL configuration:** set Site URL to your domain. Add `https://<domain>/auth/callback` (and `http://localhost:3000/auth/callback`) to the redirect URLs.
5. **Auth → Email templates:** paste the branded templates from `supabase/templates/`.
6. **Auth → SMTP:** use Resend's SMTP (`smtp.resend.com`, user `resend`, password = your Resend API key) so auth emails come from your domain.
7. **Make the owner an admin:** after the owner signs up, run
   `update profiles set role = 'admin' where email = 'owner@example.com';`

## Set up Paystack

- Put the public and secret keys in the environment. Test keys work end to end with Paystack's test cards.
- **Settings → API keys & webhooks:** set the webhook URL to `https://<domain>/api/paystack/webhook`.
- Orders are marked paid only after the webhook signature checks out **and** the transaction is verified again with Paystack's API. The success page runs the same check, in case the webhook is late. Cart totals are always recalculated on the server from database prices.

## Environment variables

| Name | What |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public URL, used in Paystack callbacks, emails and the sitemap |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase project (the legacy `..._ANON_KEY` name also works) |
| `SUPABASE_SECRET_KEY` | Server only: webhook, order creation, checked state changes (legacy `SUPABASE_SERVICE_ROLE_KEY` also works) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY` | Paystack |
| `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL` | Transactional email; the owner gets new-order and new-request alerts |
| `CRON_SECRET` | Protects `/api/cron/daily` (Vercel Cron sends it automatically) |

## Deploy (Vercel)

Import the repo, add the environment variables, deploy. `vercel.json` schedules `/api/cron/daily`. Each day it expires unpaid orders (after 24 h) and old quotes, and emails customers whose quote expires within a day.

## Where things are

| Path | What |
| --- | --- |
| `app/` | Pages: shop, product, cart, checkout, custom, account, admin, auth, content pages |
| `app/actions/` | Server actions: shop, checkout, custom, account, admin, auth |
| `app/api/paystack/webhook` | Paystack webhook |
| `components/` | Header, footer, product card, photo uploader, measurement fields, request view |
| `lib/` | Data access, Paystack, email, formatting, demo data |
| `supabase/` | Migration, seed, auth email templates |
| `public/` | Logo, signature, button-H symbol, sample photos (placeholders until HOLASKEY's own shots) |

## Design

The design tokens from the brief live in `app/globals.css` and `tailwind.config.ts`:

- **Colours:** onyx, espresso, smoke, bone, terracotta, ash, line.
- **Fonts:** Archivo, Bodoni Moda, IBM Plex Mono, Inter.
- **Look:** square corners, no shadows.

Dark is the default. The light theme toggle is in the footer.
