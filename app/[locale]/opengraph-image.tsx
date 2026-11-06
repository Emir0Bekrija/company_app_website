import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { flowCanvas, flowShapes, LOGO, LOGO_SRC } from '@/components/marketing/flow-logo'
import type { Locale } from '@/i18n/routing'
import { brand } from '@/lib/brand'

export const alt = brand.name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'hero' })
  const meta = await getTranslations({ locale: locale as Locale, namespace: 'meta.home' })
  const logo = await readFile(join(process.cwd(), 'public', LOGO_SRC))
  const canvas = flowCanvas()
  const width = 460
  const scale = width / canvas.width
  const height = Math.round(canvas.height * scale)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 80, background: '#071621', color: '#f4f8fa' }}>
        <div style={{ display: 'flex', position: 'relative', width, height }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logo.toString('base64')}`}
            alt=""
            width={Math.round(LOGO.width * scale)}
            height={Math.round(LOGO.height * scale)}
            style={{ position: 'absolute', left: -canvas.minX * scale, top: -canvas.minY * scale }}
          />
          <svg width={width} height={height} viewBox={`${canvas.minX} ${canvas.minY} ${canvas.width} ${canvas.height}`}>
            {flowShapes('flow-gradient')}
          </svg>
        </div>
        <div style={{ display: 'flex', marginTop: 44, fontSize: 76, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{t('title')}</div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: '#a9bbc7', maxWidth: 1000 }}>{meta('description')}</div>
      </div>
    ),
    size,
  )
}
