import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const PATHS = ['/', '/features', '/demo', '/solutions', '/pricing', '/contact', '/privacy']
const PAGES = [...PATHS, ...PATHS.map((p) => (p === '/' ? '/bs' : `/bs${p}`))]

/** Walks the page so scroll-driven and lazily mounted sections all render. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 60))
    }
  })
}

const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

for (const path of PAGES) {
  test(`renders cleanly: ${path}`, async ({ page }) => {
    const problems: string[] = []
    page.on('console', (m) => { if (m.type() === 'error') problems.push(m.text()) })
    page.on('pageerror', (e) => problems.push(e.message))
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    await scrollThrough(page)
    expect(problems).toEqual([])
  })

  for (const width of [360, 768, 1440]) {
    test(`no sideways scroll at ${width}: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(path)
      await scrollThrough(page)
      expect(await overflow(page)).toBeLessThanOrEqual(0)
    })
  }

  test(`accessibility: ${path}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(path)
    await scrollThrough(page)
    await page.waitForTimeout(400)
    const { violations } = await new AxeBuilder({ page }).exclude('.theme-scope').analyze()
    const serious = violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.nodes.slice(0, 4).map((n) => n.target.join(' ')).join(' | ')}`)
    expect(serious).toEqual([])
  })
}

test('every internal link resolves', async ({ page, request }) => {
  const seen = new Set<string>()
  for (const path of PAGES) {
    await page.goto(path)
    const hrefs = await page.$$eval('a[href^="/"]', (links) => links.map((a) => a.getAttribute('href')!))
    hrefs.forEach((h) => seen.add(h.split('#')[0] || '/'))
  }
  for (const href of seen) expect((await request.get(href)).status(), href).toBe(200)
})

for (const [path, autofill, submit, hr, approve] of [
  ['/demo', 'Autofill month', 'Submit for approval', 'HR', 'Approve'],
  ['/bs/demo', 'Automatski popuni mjesec', 'Pošalji na odobrenje', 'HR', 'Odobri'],
] as const) {
  test(`timesheet flow, no network: ${path}`, async ({ page }) => {
    const calls: string[] = []
    page.on('request', (r) => { if (/\/api\/|:5148|hubs/.test(r.url())) calls.push(r.url()) })
    await page.goto(path)
    const frame = page.locator('#demo-frame')
    await frame.getByRole('button', { name: autofill }).click()
    await expect(frame.getByTestId('days-left')).toHaveText('0')
    await frame.getByRole('button', { name: submit }).click()
    await frame.getByRole('radio', { name: hr }).click()
    await page.getByRole('tab', { name: path.startsWith('/bs') ? 'Odobrenja' : 'Approvals' }).click()
    await expect(frame.getByRole('button', { name: approve }).first()).toBeVisible()
    expect(calls).toEqual([])
  })
}

for (const url of ['/', '/#pricing', '/bs/pricing']) {
  test(`reload returns to the top: ${url}`, async ({ page }) => {
    await page.goto(url)
    await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' }))
    await page.waitForTimeout(200)
    await page.reload()
    await page.waitForLoadState('load')
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(page.url()).not.toContain('#')
  })
}

test('Back still restores the position after a reload', async ({ page }) => {
  await page.goto('/')
  await page.reload()
  await page.waitForLoadState('load')
  await page.waitForTimeout(300)
  await page.evaluate(() => window.scrollTo({ top: 2500, behavior: 'instant' }))
  await page.waitForTimeout(200)
  await page.evaluate(() => document.querySelector<HTMLAnchorElement>('footer a[href="/privacy"]')!.click())
  await expect(page).toHaveURL(/privacy$/)
  await page.goBack()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(2000)
})

/** Scrolls to where a section's sticky stage has finished. */
const toSectionEnd = (page: Page, selector: string) => page.evaluate((s) => {
  const box = document.querySelector(s)!.getBoundingClientRect()
  window.scrollTo({ top: window.scrollY + box.bottom - window.innerHeight, behavior: 'instant' })
}, selector)

test('tiles and lines stay hidden behind the hub core while they fan out', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  // Early in the animation, with the tiles still over the core.
  await page.evaluate(() => {
    const top = document.querySelector('#platform')!.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + 200, behavior: 'instant' })
  })
  await page.waitForTimeout(600)
  const tile = page.getByTestId('hub-tile').first()
  expect(Number(await tile.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0.5)
  const core = (await page.locator('.hub-glass').boundingBox())!
  const size = 112
  const clip = { x: core.x + core.width / 2 - size / 2, y: core.y + core.height / 2 - size / 2, width: size, height: size }
  const shown = await page.screenshot({ clip })
  await page.addStyleTag({ content: '[data-testid=hub-tile], [data-testid=hub-spokes] { visibility: hidden; }' })
  await page.waitForTimeout(100)
  const hidden = await page.screenshot({ clip })
  expect(shown.equals(hidden), 'nothing shows through the core').toBe(true)
})

for (const path of ['/', '/bs']) {
  for (const width of [360, 768, 1024, 1440]) {
    test(`hub tiles stay in view and apart at ${width}: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(path)
      await toSectionEnd(page, '#platform')
      await page.waitForTimeout(400)
      const { stage, tiles, core, clipped, viewport, spokes, onCore } = await page.evaluate(() => {
        const box = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom } }
        const els = [...document.querySelectorAll<HTMLElement>('[data-testid=hub-tile]')]
        return {
          stage: box(document.querySelector('[data-testid=hub-stage]')!),
          tiles: els.map(box),
          core: box(document.querySelector('[data-testid=hub-core]')!),
          clipped: els.filter((e) => e.scrollWidth > e.clientWidth).map((e) => e.textContent),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          // How far each line under the core reaches from the centre, in percent of the stage.
          spokes: [...document.querySelectorAll('[data-testid=hub-spokes] line')].map((l) => Math.hypot(Number(l.getAttribute('x2')) - 50, Number(l.getAttribute('y2')) - 50)),
          onCore: document.querySelector('[data-testid=hub-core]')!.parentElement!.querySelectorAll('svg').length,
        }
      })
      expect(tiles).toHaveLength(8)
      expect(spokes).toHaveLength(8)
      spokes.forEach((reach) => expect(reach).toBeGreaterThan(35))
      expect(onCore, 'lines run under the core, never on it').toBe(0)
      expect(clipped).toEqual([])
      type Box = typeof core
      const apart = (a: Box, b: Box) => a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top
      tiles.forEach((tile, i) => {
        expect(tile.left).toBeGreaterThanOrEqual(stage.left - 1)
        expect(tile.right).toBeLessThanOrEqual(stage.right + 1)
        expect(tile.top).toBeGreaterThanOrEqual(stage.top - 1)
        expect(tile.bottom).toBeLessThanOrEqual(stage.bottom + 1)
        expect(tile.right).toBeLessThanOrEqual(viewport.width)
        expect(apart(tile, core), `tile ${i} clear of the core`).toBe(true)
        tiles.slice(i + 1).forEach((other, j) => expect(apart(tile, other), `tiles ${i} and ${i + j + 1}`).toBe(true))
      })
      if (width >= 1024) {
        // Pinned on desktop, so the whole ring has to sit between the fixed header and the fold.
        expect(Math.min(...tiles.map((b) => b.top))).toBeGreaterThanOrEqual(72)
        expect(Math.max(...tiles.map((b) => b.bottom))).toBeLessThanOrEqual(viewport.height)
      }
    })
  }
}

test('pricing glass has no backdrop blur for nearby repaints to catch, at rest or on hover', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/')
  const button = page.locator('#pricing .btn-ghost').last()
  await button.scrollIntoViewIfNeeded()
  const filters = () => page.$$eval('#pricing .fluent, #pricing .btn-ghost', (els) => [...new Set(els.map((el) => getComputedStyle(el).backdropFilter))])

  await expect.poll(filters).toEqual(['none'])
  await button.hover()
  await expect(page.locator('#pricing .fluent:hover')).toHaveCount(1)
  await expect(page.locator('#pricing .btn-ghost:hover')).toHaveCount(1)
  expect(await filters()).toEqual(['none'])
})

test('the reveal starts frosted with its cards hidden, and ends sharp with them in place', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const read = () => page.evaluate(() => ({
    cards: [...document.querySelectorAll('[data-testid=reveal-card]')].map((el) => {
      const r = el.getBoundingClientRect()
      return { left: r.left, right: r.right, opacity: Number(getComputedStyle(el.firstElementChild!).opacity) }
    }),
    frost: getComputedStyle(document.querySelector('[data-testid=reveal-frost]')!).backdropFilter,
    opening: getComputedStyle(document.querySelector('[data-testid=reveal-opening]')!).clipPath,
    points: document.querySelector('[data-testid=reveal-edge] polygon')!.getAttribute('points'),
  }))

  await page.evaluate(() => {
    const top = document.querySelector('#product > div')!.getBoundingClientRect().top
    window.scrollTo({ top: window.scrollY + top, behavior: 'instant' })
  })
  await page.waitForTimeout(800)
  const before = await read()
  expect(before.cards).toHaveLength(3)
  for (const card of before.cards) expect(card.opacity).toBe(0)
  expect(before.frost).toContain('blur')
  expect(before.opening).toContain('polygon')

  // The blur has to sit inside the clip. A clip-path on the blurring element itself lets it spill out.
  const frostClip = await page.getByTestId('reveal-frost').evaluate((el) => ({
    own: getComputedStyle(el).clipPath,
    inside: el.parentElement!.getAttribute('data-testid'),
  }))
  expect(frostClip).toEqual({ own: 'none', inside: 'reveal-opening' })

  await toSectionEnd(page, '#product')
  await expect.poll(async () => (await read()).cards.map((c) => c.opacity)).toEqual([1, 1, 1])
  const after = await read()
  for (const card of after.cards) {
    expect(card.left).toBeGreaterThanOrEqual(0)
    expect(card.right).toBeLessThanOrEqual(1440)
  }
  expect(after.frost).toBe('none')
  expect(after.opening).toBe('none')
  expect(after.points).not.toBe(before.points)
  expect(await overflow(page)).toBeLessThanOrEqual(0)
})

for (const [path, width, height] of [['/', 1440, 900], ['/', 1920, 1080], ['/bs', 1440, 900], ['/bs', 1920, 1080]] as const) {
  test(`the reveal's cards rest mostly outside the app at ${width}: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.goto(path)
    await toSectionEnd(page, '#product')
    await expect.poll(() => page.getByTestId('reveal-card').evaluateAll((els) => els.map((el) => Number(getComputedStyle(el.firstElementChild!).opacity)))).toEqual([1, 1, 1])
    const { app, cards } = await page.evaluate(() => {
      const box = (el: Element) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right } }
      return { app: box(document.querySelector('[data-testid=reveal-opening]')!), cards: [...document.querySelectorAll('[data-testid=reveal-card] > *')].map(box) }
    })
    for (const card of cards) {
      const inside = Math.min(card.right, app.right) - Math.max(card.left, app.left)
      expect(inside / (card.right - card.left)).toBeLessThan(0.5)
      expect(card.left).toBeGreaterThanOrEqual(0)
      expect(card.right).toBeLessThanOrEqual(width)
    }
  })
}

test('a 2K screen shows the 1080p layout, only bigger', async ({ page }) => {
  const measure = async (width: number, height: number) => {
    await page.setViewportSize({ width, height })
    await page.goto('/')
    return page.evaluate(() => ({
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      share: document.querySelector('[data-testid=reveal-stage]')!.getBoundingClientRect().width / window.innerWidth,
    }))
  }
  const small = await measure(1920, 1080)
  const large = await measure(2560, 1440)
  expect(small.root).toBeCloseTo(16, 1)
  expect(large.root).toBeCloseTo(21.33, 1)
  expect(large.share).toBeCloseTo(small.share, 2)
})

test('entrances hide sections until they arrive, then step aside', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/pricing')
  const heading = page.getByRole('heading', { name: 'Compare every feature' })
  await expect(heading).toHaveCSS('opacity', '0')
  await heading.scrollIntoViewIfNeeded()
  await expect(heading).toHaveCSS('opacity', '1')
  await expect(heading).not.toHaveAttribute('data-reveal')
})

test('an element added after load still gets its entrance', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.waitForFunction(() => 'revealsReady' in document.documentElement.dataset)
  await page.evaluate(() => {
    const late = document.createElement('div')
    late.id = 'late'
    late.dataset.reveal = 'rise'
    late.style.cssText = 'position:fixed;top:6rem;left:1rem;width:6rem;height:6rem'
    document.body.append(late)
  })
  await expect(page.locator('#late')).toHaveCSS('opacity', '1')
  await expect(page.locator('#late')).not.toHaveAttribute('data-reveal')
})

test('entrances still play on a page reached without a reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/contact')
  await page.locator('footer').getByRole('link', { name: 'Pricing' }).click()
  await page.waitForURL('**/pricing')
  const heading = page.getByRole('heading', { name: 'Compare every feature' })
  await heading.scrollIntoViewIfNeeded()
  await expect(heading).toHaveCSS('opacity', '1')
})

test('without JavaScript nothing waits for an entrance', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/pricing')
  await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1')
  await context.close()
})

test('reduced motion keeps every section visible', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto('/')
  await scrollThrough(page)
  await expect(page.getByTestId('hub-tile')).toHaveCount(8)
  await expect(page.getByTestId('hub-tile').first()).toBeVisible()
  await expect(page.getByTestId('reveal-card').first()).toBeVisible()
  await expect(page.locator('[data-reveal]').first()).toHaveCSS('opacity', '1')
  expect(await overflow(page)).toBeLessThanOrEqual(0)
  await context.close()
})

test('glass responds to hover, its film trails the cursor, and its box stays put', async ({ page }) => {
  const film = page.waitForResponse((r) => r.url().includes('glass-film'))
  await page.goto('/pricing')
  expect((await film).status()).toBe(200)

  const card = page.locator('.fluent:has(.btn)').first()
  await card.scrollIntoViewIfNeeded()
  await expect(card).not.toHaveAttribute('data-reveal', /.*/)
  const read = (name: string) => card.evaluate((el, n) => getComputedStyle(el).getPropertyValue(n).trim(), name)
  const size = () => card.evaluate((el) => [(el as HTMLElement).offsetWidth, (el as HTMLElement).offsetHeight])
  const filmOpacity = () => card.evaluate((el) => Number(getComputedStyle(el, '::after').opacity))

  const before = await size()
  const idle = await filmOpacity()
  expect(await read('--lit')).toBe('0')

  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 20)
  await expect.poll(() => read('--lit')).toBe('1')
  await expect.poll(filmOpacity).toBeGreaterThan(idle)
  expect(await card.evaluate((el) => getComputedStyle(el, '::after').animationPlayState)).toBe('running')

  // A button in the card keeps its own state rather than inheriting the card's.
  expect(await card.locator('.btn').first().evaluate((el) => getComputedStyle(el).getPropertyValue('--lit').trim())).toBe('0')

  // One jump across the card: the film is still on its way, then arrives.
  await page.mouse.move(box.x + box.width - 20, box.y + 40)
  const target = (box.width - 20) / 1.015
  const mx = async () => parseFloat(await read('--mx'))
  expect(await mx()).toBeLessThan(target - 40)
  await expect.poll(mx).toBeGreaterThan(target - 12)

  // Only colour follows the cursor: the glass has no spot of light.
  expect(await read('--glass-lights')).not.toContain('radial-gradient')

  expect(await size()).toEqual(before)
})

test('pricing toggle changes the shown price', async ({ page }) => {
  await page.goto('/pricing')
  const main = page.locator('main')
  await expect(main).toContainText('€5')
  await main.getByRole('radio', { name: 'Monthly' }).click()
  await expect(main).toContainText('€6')
})

test('every theme can be selected', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  const group = page.locator('#themes').getByRole('radio')
  await group.first().scrollIntoViewIfNeeded()
  await expect(group).toHaveCount(7)
  for (let i = 0; i < 7; i++) {
    await group.nth(i).click()
    await expect(group.nth(i)).toHaveAttribute('aria-checked', 'true')
  }
})

test('scrolling carries on through the themes after one is picked', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  const themes = page.locator('#themes')
  await themes.scrollIntoViewIfNeeded()
  await page.evaluate(() => {
    const el = document.querySelector('#themes > div') as HTMLElement
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 40, behavior: 'instant' })
  })
  const radio = (name: string) => themes.getByRole('radio', { name, exact: true })
  await radio('Nebula').click()
  await expect(radio('Nebula')).toHaveAttribute('aria-checked', 'true')
  const slice = await page.evaluate(() => {
    const el = document.querySelector('#themes > div') as HTMLElement
    return (el.offsetHeight - window.innerHeight) / 6
  })
  await page.mouse.move(720, 450)
  await page.mouse.wheel(0, -slice)
  await expect(radio('Paper')).toHaveAttribute('aria-checked', 'true')
  await page.mouse.wheel(0, slice * 2)
  await expect(radio('High contrast')).toHaveAttribute('aria-checked', 'true')
})

test('contact form says how to reach us when email is not configured', async ({ page }) => {
  await page.goto('/contact')
  await page.locator('input[name=name]').fill('Test Person')
  await page.locator('input[name=email]').fill('person@example.com')
  await page.locator('textarea[name=message]').fill('Hello from a smoke test.')
  await page.locator('main button[type=submit]').click()
  await expect(page.locator('main [role=alert]')).toContainText('@')
})

for (const [home, target] of [['/', '/privacy'], ['/bs', '/bs/privacy']] as const) {
  test(`footer link navigates in the app: ${home}`, async ({ page }) => {
    await page.goto(home)
    await page.locator(`footer a[href="${target}"]`).click()
    await expect(page).toHaveURL(new RegExp(`${target}$`))
    await expect(page.locator('h1')).toBeVisible()
  })
}

test('language switch is a full page load and can return to English', async ({ page }) => {
  await page.goto('/pricing')
  await page.evaluate(() => { (window as unknown as { sameDocument: boolean }).sameDocument = true })

  await page.locator('header a[hreflang="bs"]:visible').click()
  await expect(page).toHaveURL(/\/bs\/pricing$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'bs')
  expect(await page.evaluate(() => 'sameDocument' in window)).toBe(false)

  await page.locator('header a[hreflang="en"]:visible').click()
  await expect(page).toHaveURL(/\/pricing$/)
  await expect(page).not.toHaveURL(/\/bs\//)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

for (const path of ['/', '/bs', '/bs/pricing']) {
  test(`share image is served: ${path}`, async ({ page, request }) => {
    await page.goto(path)
    const content = await page.locator('meta[property="og:image"]').first().getAttribute('content')
    const url = new URL(content!)
    const response = await request.get(url.pathname + url.search)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('image/png')
  })
}

for (const path of ['/', '/bs']) {
  for (const width of [360, 1024]) {
    test(`header items fit on one line at ${width}: ${path}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await page.goto(path)
      const { groups, tall } = await page.evaluate(() => {
        const shown = (el: Element) => getComputedStyle(el).display !== 'none'
        return {
          groups: [...document.querySelector('header > .wrap')!.children].filter(shown).map((el) => {
            const r = el.getBoundingClientRect()
            return { left: r.left, right: r.right, spill: el.scrollWidth - el.clientWidth }
          }),
          tall: [...document.querySelectorAll<HTMLElement>('header a, header button')]
            .filter((el) => shown(el) && el.getBoundingClientRect().height >= 48)
            .map((el) => el.textContent),
        }
      })
      expect(tall).toEqual([])
      groups.forEach((group, i) => {
        expect(group.spill).toBeLessThanOrEqual(0)
        if (i > 0) expect(group.left).toBeGreaterThanOrEqual(groups[i - 1].right)
      })
      expect(groups.at(-1)!.right).toBeLessThanOrEqual(width)
      expect(await overflow(page)).toBeLessThanOrEqual(0)
    })
  }
}

async function openPeopleStrip(page: Page) {
  await page.goto('/')
  const strip = page.getByRole('group', { name: 'Your people, properly organised' })
  // Retried because under reduced motion a hydration mismatch in product-reveal.tsx makes React rebuild the page.
  await expect(() => strip.scrollIntoViewIfNeeded({ timeout: 2000 })).toPass()
  await expect(strip).toHaveAttribute('data-loop', '')
  await page.mouse.move(0, 0)
  const offset = () => strip.locator('ul').evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41)
  return { strip, offset }
}

test('people strip drifts, stops under the mouse, drags and loops', async ({ page }) => {
  const { strip, offset } = await openPeopleStrip(page)

  // Sideways clip only, or a hovered card loses its top.
  expect(await strip.evaluate((el) => getComputedStyle(el).overflowY)).toBe('visible')

  // Copies on both sides of the real items, hidden from assistive tech and from the entrances.
  const items = strip.locator('ul > li')
  const real = strip.locator('ul > li:not([aria-hidden])')
  await expect(real).toHaveCount(6)
  expect(await items.count()).toBeGreaterThanOrEqual(18)
  await expect(strip.locator('li[aria-hidden][data-reveal]')).toHaveCount(0)

  const start = await offset()
  await expect.poll(offset).toBeLessThan(start - 5)

  const box = (await strip.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(640, y)
  await page.waitForTimeout(1500)
  const stopped = await offset()
  await page.waitForTimeout(500)
  expect(await offset()).toBeCloseTo(stopped, 1)

  const drag = async (from: number, to: number) => {
    await page.mouse.move(from, y)
    await page.mouse.down()
    await page.mouse.move(to, y, { steps: 8 })
    await page.waitForTimeout(150) // Held still, so there's no glide.
    await page.mouse.up()
  }
  await drag(900, 600)
  expect(await offset()).toBeCloseTo(stopped - 300, 0)

  // Dragged back by exactly one copy from there: the strip wraps to where it was.
  const width = await items.nth(6).evaluate((el) => (el as HTMLElement).offsetLeft) - await items.nth(0).evaluate((el) => (el as HTMLElement).offsetLeft)
  const before = await offset()
  for (let left = width; left > 0; left -= 1000) await drag(100, 100 + Math.min(left, 1000))
  expect(Math.abs(await offset() - before)).toBeLessThan(1)

  // Moving off lets it drift again.
  await page.mouse.move(0, 0)
  const resumed = await offset()
  await expect.poll(offset).toBeLessThan(resumed - 5)
})

test('people strip does not drift with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const { offset } = await openPeopleStrip(page)
  const start = await offset()
  await page.waitForTimeout(1000)
  expect(await offset()).toBe(start)
})
