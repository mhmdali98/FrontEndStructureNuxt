#!/usr/bin/env node
/**
 * Fails when physical-direction Tailwind utilities are used in class contexts inside
 * `app/` directories. Use logical utilities (ms/me/ps/pe, inset-s/e, border-s/e, …).
 * Escape hatch: a `// rtl-ok: <reason>` (or `<!-- rtl-ok: … -->`) comment on the same line.
 */
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { read, rel, walk } from './lib/files.mjs'

const PHYSICAL = [
  /^m[lr]-/, /^p[lr]-/, /^scroll-[mp][lr]-/, /^left-/, /^right-/, /^start-/, /^end-/,
  /^border-[lr](-|$)/, /^rounded-[lr](-|$)/, /^rounded-(tl|tr|bl|br)(-|$)/,
  /^text-(left|right)$/, /^float-(left|right)$/, /^clear-(left|right)$/,
]

/** Returns the offending class tokens in a class string. */
export function findPhysicalClasses(classString) {
  const bad = []
  for (const raw of classString.split(/\s+/)) {
    if (!raw || raw.startsWith('i-lucide-')) continue
    // strip variant chain (`sm:hover:`) and important / negative prefixes
    const base = raw.split(':').pop().replace(/^!/, '').replace(/^-/, '').replace(/!$/, '')
    if (PHYSICAL.some(re => re.test(base))) bad.push(raw)
  }
  return bad
}

const CLASS_CONTEXTS = [
  /\bclass="([^"]*)"/g,
  /:class="([^"]*)"/g,
  /\bclass:\s*'([^']*)'/g,
  /\b(?:root|base|body|header|footer|content|container|inner|td|th|wrapper|label|leadingIcon|trailingIcon|link|item|description)\s*:\s*'([^']*)'/g,
]

/** Scans one source file; returns `{ line, token }` issues. */
export function scanSource(source) {
  const issues = []
  const lines = source.split('\n')
  lines.forEach((line, i) => {
    if (/rtl-ok:/.test(line)) return
    for (const re of CLASS_CONTEXTS) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(line))) {
        // only look at string-literal contents inside bound expressions
        const content = re.source.startsWith(':class') ? (m[1].match(/'[^']*'/g) ?? []).join(' ').replace(/'/g, ' ') : m[1]
        for (const token of findPhysicalClasses(content)) issues.push({ line: i + 1, token })
      }
    }
  })
  return issues
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const files = [
    ...walk(resolve(root, 'app'), ['.vue', '.ts']),
    ...walk(resolve(root, 'layers'), ['.vue', '.ts']).filter(f => /\/app\//.test(f)),
  ]
  let count = 0
  for (const f of files) {
    for (const issue of scanSource(read(f))) {
      count++
      console.error(`${rel(root, f)}:${issue.line}  physical utility "${issue.token}" – use a logical one`)
    }
  }
  if (count) {
    console.error(`\ncheck-rtl: ${count} issue(s)`)
    process.exit(1)
  }
  console.log(`check-rtl: OK (${files.length} files)`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
