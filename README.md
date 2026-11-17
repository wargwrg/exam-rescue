# Exam Rescue · by Clutch Up

A revision-planner web app. Students add their exams, topics and free time, and the app plans every study session until their last exam, then re-plans as they log progress.

It runs in two modes:

| Mode | When | What happens |
|---|---|---|
| **Demo mode** | No keys added (default) | Everything is saved in the browser. "Unlock" works without paying. Good for testing and showing people. |
| **Live mode** | Supabase keys added | Real accounts (email link or Google), data synced across phone and laptop, 3-day free trial, then payment. |

---

## 1. Put it online (about 5 minutes, free)

1. Create a new **empty** repository on GitHub (e.g. `exam-rescue`) and upload everything in this folder **except** `node_modules` and `dist`.
2. Go to **vercel.com → Add New → Project**, pick that repository and click **Deploy**. Vercel detects the settings by itself.

That's it: you get a link like `exam-rescue.vercel.app` running in demo mode.

## 2. Turn on real accounts (Supabase, free tier)

1. **supabase.com → New project.**
2. Open **SQL Editor → New query**, paste everything from `supabase/schema.sql`, and click **Run**.
3. Open **Authentication → URL Configuration** and set **Site URL** to your Vercel link.
4. *(Optional)* For Google sign-in, open **Authentication → Providers → Google** and follow the steps there.
5. Copy **Project Settings → API → Project URL** and the **anon public** key. In Vercel → your project → **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon key
6. In Vercel → **Deployments**, click **⋯ → Redeploy**.

## 3. Take payments (Lemon Squeezy)

Lemon Squeezy is a "merchant of record": it charges the customer and handles EU VAT for you.

1. Create a product "Exam Rescue season pass" at your price. Copy its **checkout link** (Share → checkout URL).
2. Add these in Vercel:
   - `VITE_CHECKOUT_URL` = the checkout link
   - `VITE_PRICE_LABEL` = e.g. `€14.99`
   - `SUPABASE_URL` = same as `VITE_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase → Project Settings → API → **service_role** key (never share this one)
   - `LEMONSQUEEZY_WEBHOOK_SECRET` = any long random password you make up
3. In Lemon Squeezy, open **Settings → Webhooks → +**:
   - URL: `https://YOUR-APP.vercel.app/api/lemonsqueezy-webhook`
   - Signing secret: the same password as `LEMONSQUEEZY_WEBHOOK_SECRET`
   - Event: `order_created`
4. Redeploy in Vercel.

When a student pays, Lemon Squeezy tells the app, and their account is unlocked for 365 days automatically.

### Access codes (Etsy, schools, giveaways)

In the Supabase SQL Editor, run:

```sql
insert into public.redeem_codes (code, note) values ('ETSY-7Q2K-91', 'Etsy order 123');
```

The student enters the code on the Unlock screen and gets a year of access. Each code works once.

---

## Running it on your computer (optional)

```bash
npm install
npm run dev      # opens on http://localhost:5173
npm test         # runs the planner and payment tests
```

## Where things are

| Path | What it is |
|---|---|
| `src/lib/engine.ts` | The planner: priority scores, session allocation, warnings. Tested against the Excel version. |
| `src/lib/backend.ts` | Login, saving, trial and unlock rules. |
| `src/screens/` | One file per screen (Today, Plan, Topics, Progress, Settings, Unlock, setup). |
| `supabase/schema.sql` | Database tables and security rules. |
| `api/lemonsqueezy-webhook.ts` | Unlocks accounts after payment. |
| `tests/` | Automated tests (engine vs spreadsheet, 300 random schedules, webhook security). |

## Rules worth knowing

- **Trial:** 3 days from first sign-in (`TRIAL_DAYS` in `src/lib/backend.ts`). After that, only the Unlock and Settings screens open, and the student's data is kept.
- **Priority score:** 40% weakness + 30% importance + 30% exam urgency, plus up to +15 for topics flagged in past papers. High ≥ 70, Medium ≥ 45.
- **Students can't give themselves access:** the database only lets them edit their own plan data. Only the webhook and the code function can change `paid_until`.
