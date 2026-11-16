#!/usr/bin/env node
/**
 * Enforces feature isolation (auto-imports bypass `no-restricted-imports`):
 * - a feature may not use another feature's components, composables, stores,
 *   i18n keys or `#layers/<feature>` imports;
 * - core may not use any feature's.
 */
import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { read, rel, walk } from './lib/files.mjs'

const pascal = s => s.split(/[-_]/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Patterns that identify usage of `feature`'s public surface. Each pattern captures the
 * identifier in group 1 so names owned by core (e.g. `useAuthStore`) can be allowed.
 */
export function featurePatterns(feature) {
  const P = escapeRe(pascal(feature))
  const f = escapeRe(feature)
  return [
    // template tags, lazy variants, #components imports and resolveComponent()
    { kind: 'component', re: new RegExp(`(?:(?<![\\w$])<|\\bLazy|resolveComponent\\(['"]|import \\{[^}]*\\b)(${P}[A-Z][A-Za-z0-9]*)`, 'g') },
    { kind: 'composable', re: new RegExp(`\\b(use${P}[A-Z]?[A-Za-z0-9]*)\\s*\\(`, 'g') },
    // i18n keys passed to t()/te()/$t() or registry labelKeys
    { kind: 'i18n key', re: new RegExp(`(?:\\b(?:t|te|tm|\\$t)\\(\\s*|labelKey:\\s*)['"\`](${f}\\.[a-zA-Z][\\w.]*)`, 'g') },
    { kind: 'layer import', re: new RegExp(`(#layers/${f})(?:/|['"])`, 'g') },
  ]
}

/** Returns violations of `source` (owned by `owner`) against the other features. */
export function scanFile(source, owner, features, coreNames = new Set()) {
  const out = []
  const lines = source.split('\n')
  for (const feature of features) {
    if (feature === owner) continue
    for (const { kind, re } of featurePatterns(feature)) {
      lines.forEach((line, i) => {
        if (/boundary-ok:/.test(line)) return
        re.lastIndex = 0
        let m
        while ((m = re.exec(line))) {
          if (!coreNames.has(m[1])) out.push({ line: i + 1, feature, kind, name: m[1] })
        }
      })
    }
  }
  return out
}

/** Component, composable and store names defined by core (always allowed). */
export function collectCoreNames(coreDir) {
  const names = new Set()
  for (const f of walk(join(coreDir, 'app/components'), ['.vue'])) names.add(f.split('/').pop().replace(/\.vue$/, ''))
  for (const f of walk(join(coreDir, 'app'), ['.ts'])) {
    for (const m of read(f).matchAll(/export (?:async )?(?:function|const) (use[A-Z]\w*)/g)) names.add(m[1])
  }
  return names
}

export function listFeatures(layersDir) {
  return readdirSync(layersDir, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== 'core')
    .map(d => d.name)
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const layersDir = join(root, 'layers')
  const features = listFeatures(layersDir)
  const coreNames = collectCoreNames(join(layersDir, 'core'))
  let count = 0
  for (const owner of ['core', ...features]) {
    const files = walk(join(layersDir, owner), ['.vue', '.ts']).filter(f => !f.includes('/test/'))
    for (const f of files) {
      for (const v of scanFile(read(f), owner, features, coreNames)) {
        count++
        console.error(`${rel(root, f)}:${v.line}  ${owner} uses ${v.feature}'s ${v.kind} "${v.name}"`)
      }
    }
  }
  if (count) {
    console.error(`\ncheck-boundaries: ${count} violation(s). Move shared code into layers/core.`)
    process.exit(1)
  }
  console.log(`check-boundaries: OK (${features.length} features)`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
