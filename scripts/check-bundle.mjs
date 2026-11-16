#!/usr/bin/env node
/**
 * Bundle budgets on the production build (`pnpm build` first):
 * - entry JS ≤ 200 KB gzip, every other chunk ≤ 150 KB gzip
 * - no @tanstack/charts code in the chunks loaded by /login (from a real browser network log)
 * - exactly one installed copy of vue, @vueuse/core and reka-ui
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { startServer } from './lib/server.mjs'
import { chromiumPath } from './lib/browser.mjs'

const KB = 1024
export const BUDGET = { entry: 200 * KB, chunk: 150 * KB }

export function gzipSize(buf) {
  return gzipSync(buf, { level: 9 }).length
}

/** Pure budget evaluation, unit-testable. */
export function evaluateBudgets(chunks, entryFile) {
  const failures = []
  for (const c of chunks) {
    const limit = c.file === entryFile ? BUDGET.entry : BUDGET.chunk
    if (c.gzip > limit) failures.push(`${c.file}: ${(c.gzip / KB).toFixed(1)} KB gzip > ${limit / KB} KB`)
  }
  return failures
}

/** Distinct resolved versions of `pkg` in the `packages:` section of pnpm-lock.yaml. */
export function lockedVersions(lockfile, pkg) {
  // pnpm 11+ lockfiles are multi-document; the importer graph is the last `packages:` block.
  const parts = lockfile.split(/^packages:\s*$/m)
  const section = parts[parts.length - 1]?.split(/^snapshots:\s*$/m)[0] ?? ''
  const esc = pkg.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  const re = new RegExp(`^\\s{2}'?${esc}@([^':(]+)`, 'gm')
  return [...new Set([...section.matchAll(re)].map(m => m[1]))]
}

async function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const dir = join(root, '.output/public/_nuxt')
  if (!existsSync(dir)) {
    console.error('check-bundle: run `pnpm build` first')
    process.exit(1)
  }
  const chunks = readdirSync(dir).filter(f => f.endsWith('.js')).map((file) => {
    const buf = readFileSync(join(dir, file))
    return { file, raw: buf.length, gzip: gzipSize(buf), charts: buf.includes('ts-chart') }
  })

  const { base, stop } = await startServer(root, 3456)
  let loginChunks = []
  let entryFile = ''
  try {
    const html = await (await fetch(`${base}/login`)).text()
    entryFile = (html.match(/<script type="module" src="\/_nuxt\/([^"]+)"/) ?? [])[1] ?? ''
    const { chromium } = await import('@playwright/test')
    const browser = await chromium.launch({ executablePath: chromiumPath() })
    const page = await browser.newPage()
    page.on('response', (r) => {
      const m = r.url().match(/\/_nuxt\/([^?]+\.js)/)
      if (m) loginChunks.push(m[1])
    })
    await page.goto(`${base}/login`, { waitUntil: 'networkidle' })
    await browser.close()
  }
  finally {
    stop()
  }
  loginChunks = [...new Set(loginChunks)]

  const failures = evaluateBudgets(chunks, entryFile)
  const chartsOnLogin = loginChunks.filter(f => chunks.find(c => c.file === f)?.charts)
  if (chartsOnLogin.length) failures.push(`@tanstack/charts loaded on /login: ${chartsOnLogin.join(', ')}`)

  const lock = readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')
  const dupes = {}
  for (const pkg of ['vue', '@vueuse/core', 'reka-ui']) {
    const versions = lockedVersions(lock, pkg)
    dupes[pkg] = versions
    if (versions.length !== 1) failures.push(`${pkg}: ${versions.length} installed versions (${versions.join(', ')})`)
  }

  const entry = chunks.find(c => c.file === entryFile)
  const largest = [...chunks].sort((a, b) => b.gzip - a.gzip).slice(0, 5)
  const loginTotal = loginChunks.reduce((a, f) => a + (chunks.find(c => c.file === f)?.gzip ?? 0), 0)
  const report = {
    entry: entry ? { file: entry.file, gzipKB: +(entry.gzip / KB).toFixed(1) } : null,
    loginJsGzipKB: +(loginTotal / KB).toFixed(1),
    loginChunks: loginChunks.length,
    largestChunks: largest.map(c => ({ file: c.file, gzipKB: +(c.gzip / KB).toFixed(1) })),
    versions: dupes,
  }
  console.log(JSON.stringify(report, null, 2))
  writeFileSync(join(root, 'docs/bundle.json'), `${JSON.stringify(report, null, 2)}\n`)
  if (failures.length) {
    console.error(`\ncheck-bundle: FAILED\n- ${failures.join('\n- ')}`)
    process.exit(1)
  }
  console.log('check-bundle: OK')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
