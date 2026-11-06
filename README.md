# Navitecs Flow website

The public marketing site for Navitecs Flow: Next.js, English at `/` and Bosnian at `/bs`. It includes a working product demo that runs entirely in the browser on sample data and has no network code.

## Commands

```bash
npm install
npm run dev         # http://localhost:3000
npm run build
npm run lint
npm run typecheck
npm test            # logic: demo engine, pricing, ROI, formatting, contact form
npm run test:e2e    # needs a build first, plus: npx playwright install chromium
npm run sync:app    # copy theme files from the app into vendor/app
npm run sync:check  # report drift from the app
```

Copy `.env.example` to `.env.local` for local settings. The site runs without any of them.

## Where things live

| Change | File |
|---|---|
| Name, logo, addresses, URLs | `lib/brand.ts`, `components/marketing/logo.tsx` |
| Site copy | `messages/en.json`, `messages/bs.json` |
| Demo copy | `lib/demo/strings.ts` |
| Demo behaviour and sample data | `lib/demo/engine.ts` |
| Plans, prices, comparison table | `lib/pricing/plans.ts` |
| ROI formula | `lib/metrics/roi.ts` |
| /features page modules | `lib/features/modules.ts` |
| Site colours, bands, buttons | `styles/globals.css` |

`vendor/app/` is generated from the app by `scripts/sync-app.mjs`, so don't edit it by hand. Dates and money go through `lib/format.ts`, because browsers don't reliably carry Bosnian locale data.

Before writing copy, check `docs/feature-inventory.md`. Before going public, work through `docs/launch-checklist.md`.
