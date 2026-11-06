import next from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  { ignores: ['.next/**', 'vendor/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**'] },
  ...next,
  ...nextTs,
]

export default config
