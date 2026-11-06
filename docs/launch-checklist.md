# Launch checklist

The site runs without these, but each one needs a decision or a value before it goes public.

## Decisions

1. **Prices.** Every price in `lib/pricing/plans.ts` is a placeholder.
2. **Billing gap.** The app has no plans or billing, so anyone who registers gets every feature for free. To avoid that at launch, set `PLAN_CTA_MODE` to `'contact'` in `lib/pricing/plans.ts`, which sends all pricing buttons to the contact form.
3. **Name and logo.** The product is Navitecs Flow and the company stays NAVITECS d.o.o. To change either, edit `lib/brand.ts`, `components/marketing/flow-logo.tsx`, `components/marketing/logo.tsx` and `app/icon.svg`. The share image in `app/[locale]/opengraph-image.tsx` uses the same logo.

## Settings

Set these in the host's environment; `.env.example` lists them.

- `NEXT_PUBLIC_SITE_URL`: canonical URLs, sitemap and share images. Defaults to https://www.navitecs.com, which is unconfirmed.
- `NEXT_PUBLIC_APP_URL`: until this is set, "Create your workspace" goes to the contact form.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO`, `CONTACT_FROM`: without these, the contact form shows the email address instead of sending.

## Reviews

- **Bosnian copy:** `messages/bs.json` and the second value of each pair in `lib/demo/strings.ts`. Needs a native speaker, including the rewording that keeps "Navitecs Flow" undeclined ("u aplikaciji Navitecs Flow").
- **Privacy text:** `/privacy` is a draft and needs legal review.
- **Analytics:** `lib/analytics.ts` sends nothing until a tag manager is added. Adding one needs a consent decision and an update to the privacy text.

## Changes in the app (not made, because the app stays untouched)

- **Wrong word for the timesheet form:** the site now says "timesheet" in English and "šihterica" in Bosnian, but the app still shows "Šihtarica" in `en/export.json:4`, `en/timesheets.json:64`, `bs/export.json:4`, `bs/leave.json:506`, `bs/timesheets.json:42` and `bs/settings.json:233`. Downloaded files are also named `Sihtarica_*.xlsx` (`TimesheetExcelExportService.cs:107-108`, `TimesheetsController.cs:135`, and the frontend fallbacks in `use-timesheet-export.ts:84` and `export-timesheets.ts:16`).
- **Active Month:** the current month can't stay closed, because `GET /active-month` reactivates it, so Deactivate on it reverts at once. The Past Months / Closed card never renders, because that API returns active rows only.
- **Expense categories:** the backend has the endpoints, but the frontend only reads the list and nothing seeds it, so companies only see Uncategorised. The site no longer mentions categories.
- **Needs a document on absence types:** it appears to do nothing on types that go through approval, because only the report path sets a document status and the request form has no uploader.
- **Register link:** the login page opens on Sign in and can't deep-link to Register (`login-form.tsx:36`), so visitors need one extra click.
- **Registration protection:** there's no CAPTCHA or approval step, which matters more once the link is public.
- **Enforcing plans:** needs `Plan` and seat fields on `Company`, a seat check on invites, a `[RequiresPlan]` filter plus nav gating, and a payment provider. Filtering permissions isn't enough, because workers use timesheets, leave and tasks with no permission grants at all.

## After the Navitecs Flow rename

- **Email sender:** the app's default `FromName` is now Navitecs Flow, but an `Email__FromName` setting on the host overrides it.
- **Existing 2FA users:** their authenticator entry keeps the label Navitecs. Codes still work, and only new setups show Navitecs Flow.
- **Calendar subscriptions:** some clients keep the old calendar name until the user subscribes again.
- **Identifiers kept on purpose:** the app's Data Protection name, encryption labels, `navitecs_rt` cookie and calendar UIDs still say navitecs. Renaming them breaks links, stored secrets, sessions or calendars.

## Licences and limits

- **QuestPDF:** the Community licence only applies below $1M annual revenue.
- **Contact form rate limit:** counted per server instance and held in memory, which suits a low-volume form. `clientKey` in `lib/contact.ts` assumes exactly one proxy in front of the site, so check that against the final host.
