#!/usr/bin/env node
/**
 * Lighthouse budgets on the production build (mock mode, zero latency):
 * desktop preset, median of 3 runs on /login and / (logged in as admin).
 * Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, CLS on / < 0.05.
 * Writes docs/perf.json. Run `pnpm build` first.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startServer } from './lib/server.mjs'
import { chromiumPath } from './lib/browser.mjs'

export const BUDGETS = { 'performance': 0.9, 'accessibility': 0.95, 'best-practices': 0.95, 'cls': 0.05 }

export function median(values) {
  const s = [...values].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

async function sessionCookie(base) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-requested-with': 'fetch', 'origin': base },
    body: JSON.stringify({ email: 'admin@demo.test', password: 'Password123!' }),
  })
  const cookie = res.headers.getSetCookie().map(c => c.split(';')[0]).join('; ')
  if (!res.ok || !cookie) throw new Error(`login failed: ${res.status}`)
  return cookie
}

function lighthouse(root, url, headers) {
  const out = join(mkdtempSync(join(tmpdir(), 'lh-')), 'report.json')
  const args = [url, '--preset=desktop', '--output=json', `--output-path=${out}`, '--quiet',
    '--only-categories=performance,accessibility,best-practices',
    '--chrome-flags=--headless=new --no-sandbox']
  const chrome = chromiumPath()
  if (chrome) args.push(`--chrome-path=${chrome}`)
  if (headers) args.push(`--extra-headers=${JSON.stringify(headers)}`)
  execFileSync(join(root, 'node_modules/.bin/lighthouse'), args, { stdio: 'ignore' })
  const r = JSON.parse(readFileSync(out, 'utf8'))
  return {
    'performance': r.categories.performance.score,
    'accessibility': r.categories.accessibility.score,
    'best-practices': r.categories['best-practices'].score,
    'cls': r.audits['cumulative-layout-shift'].numericValue,
    'lcpMs': Math.round(r.audits['largest-contentful-paint'].numericValue),
    'tbtMs': Math.round(r.audits['total-blocking-time'].numericValue),
  }
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const { base, stop } = await startServer(root, 3457, { NUXT_MOCK_LATENCY_MS: '0' })
  const results = {}
  try {
    const cookie = await sessionCookie(base)
    for (const [name, path, headers] of [['login', '/login', null], ['home', '/', { Cookie: cookie }]]) {
      const runs = [0, 1, 2].map(() => lighthouse(root, `${base}${path}`, headers))
      results[name] = Object.fromEntries(Object.keys(runs[0]).map(k => [k, median(runs.map(r => r[k]))]))
    }
  }
  finally {
    stop()
  }
  const failures = []
  for (const [page, r] of Object.entries(results)) {
    for (const k of ['performance', 'accessibility', 'best-practices']) {
      if (r[k] < BUDGETS[k]) failures.push(`${page} ${k} ${Math.round(r[k] * 100)} < ${BUDGETS[k] * 100}`)
    }
  }
  if (results.home && results.home.cls >= BUDGETS.cls) failures.push(`home CLS ${results.home.cls.toFixed(3)} ≥ ${BUDGETS.cls}`)
  const report = { measuredAt: new Date().toISOString(), mode: 'production build, mock API, 0 ms latency, desktop preset, median of 3', results, failures }
  writeFileSync(join(root, 'docs/perf.json'), `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  if (failures.length) process.exit(1)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
