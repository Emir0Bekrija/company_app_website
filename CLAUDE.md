# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The public marketing site for Navitecs Flow, a timesheet, leave, task and invoicing app made by the company NAVITECS d.o.o. Use "Navitecs Flow" for the product and "Navitecs" only for the company. Next.js 16 App Router, React 19, TypeScript, Tailwind 4, `motion`, `next-intl`. English lives at `/`, Bosnian at `/bs`.

It sits next to the app, in its own git repo:

- `../company-system/CompanyApp.API_WEB`: the app's frontend
- `../company-system/CompanyApp.API`: the app's backend

**Never modify anything under `../company-system`.** Read it to check what the product really does. If the site needs an app change, add it to `docs/launch-checklist.md` instead.

The repo is on `main` with no commits yet. Commit only when asked.

## Commands

```bash
npm run dev         # http://localhost:3000
npm run build
npm run lint
npm run typecheck
npm test            # Vitest: demo engine, pricing, ROI, formatting, contact form
npm run test:e2e    # Playwright on port 3100; run a build first
npm run sync:app    # copy theme files from the app into vendor/app
npm run sync:check  # report drift from the app
npm run make:film   # rebake styles/glass-film.webp, the glass's soap film
```

Playwright needs `npx playwright install chromium` once. `playwright.config.ts` starts `next start -p 3100` and refuses to run if that port is taken.

Only one `next dev` can run per folder, and the user often has one open on port 3000. Reuse it rather than starting another. Stop only processes you started, by exact PID, and never with a filter on `node.exe`. On this machine `Get-NetTCPConnection` and `netstat` can miss listeners, so find Node servers through `Get-CimInstance Win32_Process` command lines.

Very large Bash heredocs can fail to parse here, and then nothing runs. Use the Write tool for new files.

## Verifying UI

Automated checks stop at typecheck, lint, build, Vitest and Playwright. Don't use Claude-in-Chrome or take screenshots to judge the design unless asked: the user reviews the look in their own browser.

## Rules for copy

**Never invent product capabilities, statistics or testimonials.** `docs/feature-inventory.md` lists what may be claimed, what must never be claimed, and the safe security wording. Check it before writing copy, and confirm anything new against the app's code.

All site copy exists in both `messages/en.json` and `messages/bs.json` with the same keys. Demo copy is in `lib/demo/strings.ts` as `[english, bosnian]` pairs. Change both languages together.

Dates and money go through `lib/format.ts`, never `bs-BA` with `Intl` or `toLocale*`. Browsers lack Bosnian data: Chromium prints `2026 M11` and `€ 5`, which is wrong and also breaks hydration.

## Where things live

| Change | File |
|---|---|
| Name, addresses, URLs | `lib/brand.ts` |
| Logo (NAVITECS image plus drawn FLOW) | `components/marketing/flow-logo.tsx`, `public/brand/` |
| N mark for tiny spaces, favicon | `components/marketing/logo.tsx`, `app/icon.svg` |
| Plans, prices, comparison table | `lib/pricing/plans.ts` |
| Demo behaviour and sample data | `lib/demo/engine.ts` (pure reducer) |
| Feature presentations | `lib/demo/tours.ts`, copy in `lib/demo/tour-strings.ts` |
| ROI formula | `lib/metrics/roi.ts` |
| /features modules | `lib/features/modules.ts` (each needs a tour) |
| Metadata, canonical, hreflang | `lib/seo.ts` |
| Site colours, bands, buttons | `styles/globals.css` |
| Home page section order | `app/[locale]/page.tsx` |

- `components/marketing/`: site sections, header, footer
- `components/pricing/`: pricing cards, comparison table
- `components/demo/`: the demo, rebuilt from the app's views

## How it works

### Demo
Runs entirely in the browser on sample data and must never contain network code. `lib/demo/store.tsx` wraps the reducer and keeps state in `sessionStorage`. Demo components load through `components/demo/lazy.tsx` (`ssr: false`, plus `WhenNear` to mount them on approach), which avoids date and hydration mismatches. An action in one module shows up in others, such as a submitted month reaching the HR queue.

### Feature presentations
Every card on `/features` links to `/demo?tour=<feature>`, read on the client so the page stays static. `lib/demo/tours.ts` holds one tour per feature as data: a start screen, a role, an optional `setup` and steps. Starting a tour resets to a fresh sample company, so it always works. A step's `done` reads the demo state; a step with no `done` is look-only and waits for Next. Progress only moves forward. `targets` are `data-tour` values, best first, so a step can ring a form's button while the form is open and the button that opens it otherwise. `components/demo/tour.tsx` portals the card next to the dialogs, because inside the frame's content it can't sit above them. `tests/tours.test.ts` finishes every tour through the reducer on several dates, so add a script there with each new tour. Keep `components/demo/` flat: `tests/strings.test.ts` reads every entry as a file.

### Themes
`vendor/app/` is generated by `scripts/sync-app.mjs`, so never edit it by hand. `ThemeScope` puts a theme's tokens on a div, so product frames can show any app theme while the site keeps its own look. Site colours are separate `--band-*` tokens. Keep the two families apart. Inside a `.theme-scope` the app's rules apply: tokens such as `text-ink-1`, and Inter as the typeface.

### Bands and diagonal cuts
Sections are `<Band tone edge>` with tones `night`, `deep`, `mist`, `paper` and edges `rise`, `fall`, `chevron`, `peak`. Every cut shares the `--cut` value. Inside a band, use `text-fg`, `text-muted-fg`, `border-line` and `bg-raised` so text works on any tone.

### Routing
`proxy.ts` is next-intl's middleware (Next 16 renamed it). Use `Link` and friends from `@/i18n/navigation`, not `next/link`. Because English has no prefix, Next's client router can mis-guess a route when prefetching and get a 404, which is why the footer's privacy link sets `prefetch={false}`. The language switch must stay a full page load: the locale is a root layout param, so a client-side switch re-renders the layout's inline scripts, which never run that way and make React log an error. Pages must call `setRequestLocale(locale)`. A page's own `openGraph` block replaces the inherited one, so `lib/seo.ts` sets the share image explicitly.

### Scale
The `html` font size grows with the screen above 1080p, so a 2K monitor shows the 1080p layout 1.33 times bigger. Use rem, not px, for anything that should grow with it. Only hairlines stay in px.

### Fluent glass
`.fluent` is the site's liquid glass surface and `.fluent-rim` is a rim alone, for product frames. `.btn` shares the same rim. The rim is a masked `::before`, so these surfaces need rounded corners, not a `clip-path`, which would also cut off their shadows. Its lift uses the standalone `scale` property, because `motion` owns `transform` on hub tiles and Tailwind's centring uses `translate`.

The material has four depths: frosted backdrop, light (`--glass-lights`, a gloss layer on the element), soap film (`::after`) and rim (`::before`), with text above them all. `--lit` is the one dial for how much light it has caught, 0 at rest and 1 on hover. `fluent-reveal.tsx` eases `--mx` and `--my` behind the cursor in a rAF loop and writes `--tx` and `--ty`, the same position from -1 to 1. These move only the film and the rim's colours. A light that followed the cursor was removed on purpose because the user didn't like the look, so don't add one back. The film is `styles/glass-film.webp`, baked by `npm run make:film`, and it's a bitmap because an inline SVG filter is recalculated on each repaint. Per-tone tokens are `--iris-*`, `--film-idle`, `--film-on` and `--film-tone`. `.glass-quiet` turns the iridescence down to barely visible, on the people strip and the pricing cards other than the popular one, on any tone. `.plan-popular` tints that one card violet to magenta by overriding tokens only, and is made for dark tones. `.glass-still` drops the backdrop blur, for glass with only a band's smooth gradient behind it that sits within about 4rem of something that repaints, such as the pricing cards under the native slider. The blur's reach pulls the surface into that repaint, which is suspected to draw a hard edge across it.

Contrast sets the limits here. On dark glass the pastel film lifts the ground under the text, so `--film-tone` deepens it until it shifts hue without adding much light, and the white light weight in `--glass-lights` stays low. Measure text contrast on hover before raising any of them. `.btn-primary` is solid, so its film blends as `color`, which keeps luminosity, and its ground deepens with `--lit`. Keep `--glass-shadow` and `--glass-shadow-hover` the same shape, or the browser snaps between them instead of fading.

`backdrop-filter` only sees what is inside its own band, because a band's `clip-path` ends what it can reach. Glass needs colour behind it in that band, which is what `--band-glow` provides. `opacity`, `filter`, `mask` and `clip-path` on an ancestor cut the blur off in the same way, so keep them on the glass element itself or on siblings. `Float` in `product-reveal.tsx` and the hub's ring wrapper are built around this.

### Reveal and hub
`product-reveal.tsx` can't border a `clip-path`, so the glass edge is an SVG polygon from the same points. The frost is a pane above the screen, because `filter: blur()` on the screen would break the theme's own glass. That pane must sit inside the clipped element: a `clip-path` on the blurring element itself doesn't contain the blur, and a ghost of the app shows around the diamond. Scroll goes through a spring so wheel steps don't jump.

`platform-hub.tsx` is DOM and CSS 3D with no WebGL, and one version serves every device. Tiles sit in a fixed ring and only travel from the centre outwards, so they can't leave the stage. The half-step start angle is what fits eight tiles at 360px. Each line's tip follows its tile. The core (`.hub-glass`) is glass over a solid fill, not see-through: tiles fan out from behind it and lines appear only outside it, so it has no `backdrop-filter`. `e2e/smoke.spec.ts` checks tile bounds and overlaps in both languages.

### Entrances
Add `data-reveal="rise|left|right|pop|tilt|mask"` and, for a stagger, `style={stagger(i)}`. `scroll-reveal.tsx` plays each one once and then removes the attribute, and also picks up elements added later, including ones rebuilt by Fast Refresh. Styles are at the end of `globals.css`. Only `html[data-reveals]`, set by an inline script in the layout, hides anything, so the page is complete without JavaScript or with reduced motion. Put the attribute on glass directly, never on a parent of it. The first screen uses `.hero-in`, a CSS animation, so it doesn't wait for JavaScript.

### People strip
`drift-strip.tsx` moves a track by transform, so it isn't a scroller: that gives sub-pixel drift and lets overflow clip sideways only, which keeps a hovered card's top intact. Copies go on both sides of the real items and the position wraps by one copy's width. Each copy needs the same item count, and a multiple of 6 keeps the `nth-child` film offsets seamless. Copies must be aria-hidden, without `data-reveal` or `WhenNear`: `ScrollReveal` never sees them and a clip hides them from observers. It's a plain scroller until it nears the screen, and without JavaScript.

### Reload
An inline script in `app/[locale]/layout.tsx` sends a reload to the top and removes any hash, then hands scroll restoration back to the browser so Back still works.

### Contact form
`app/api/contact/route.ts` validates with zod, has a honeypot and a per-IP limit, and sends over SMTP. Credentials stay in environment variables. Without SMTP it returns 503 and the form shows the contact address. `clientKey` in `lib/contact.ts` trusts only the last `X-Forwarded-For` entry, which assumes one proxy in front of the site.

## Design rules

The look comes from the Navitecs letterhead: diamonds, chevrons and the N mark. Archivo is the site's typeface, and Inter appears only inside product frames. Fonts must include Latin Extended for č, ć, đ, š and ž.

- The hero is copy-led. Product screens start in the section below it, and the calendar never goes in the hero.
- Keep the frosted glass and animated aurora at full richness in the themes. Fix performance some other way.
- Buttons, cards and other surfaces follow Fluent Design: rounded acrylic glass with gradient rims. Diamonds and chevrons stay in the band cuts, hero lattice and reveal.
- Spend the boldness on the diamond reveal. Other sections get short entrances that differ by section, not one fade-up everywhere. Vary section layouts.
- No all-caps eyebrow labels, middle-dot strings, `→` in buttons, monospace labels. Use numbered markers only for real sequences.
- All motion respects `prefers-reduced-motion`. Layouts must not scroll sideways at 360px.

## Open work

- Mobile main heading takes 5.3 s in Lighthouse's throttled test (performance 76). The Archivo font is suspected, not confirmed.
- Axe scans skip `.theme-scope`, and no keyboard run through the demos has been done.
- Launch decisions (prices, the billing gap, settings, reviews) are in `docs/launch-checklist.md`.
