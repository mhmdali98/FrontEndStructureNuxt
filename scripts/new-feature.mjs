#!/usr/bin/env node
/**
 * Scaffolds a feature layer from templates/feature:
 *   pnpm new:feature invoices
 * Creates layers/<name> with config, i18n, a page, API module, query keys + composable,
 * a navigation registration, a permission type and a test. The boundary checker picks up
 * the new prefix automatically (it derives prefixes from the layer directories).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function toNames(raw) {
  const name = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!/^[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid feature name "${raw}"`)
  const Name = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
  const label = name.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  return { name, Name, label, camel: Name.charAt(0).toLowerCase() + Name.slice(1) }
}

export function render(text, n) {
  return text.replaceAll('__Name__', n.Name).replaceAll('__name__Keys', `${n.camel}Keys`).replaceAll('__name__', n.name).replaceAll('__label__', n.label)
}

function copyTree(src, dest, n, written) {
  for (const entry of readdirSync(src)) {
    if (entry === 'README.md') continue
    const from = join(src, entry)
    const to = join(dest, render(entry, n).replace(/\.tpl$/, ''))
    if (statSync(from).isDirectory()) copyTree(from, to, n, written)
    else {
      mkdirSync(dirname(to), { recursive: true })
      writeFileSync(to, render(readFileSync(from, 'utf8'), n))
      written.push(to)
    }
  }
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const raw = process.argv[2]
  if (!raw) {
    console.error('Usage: pnpm new:feature <name>')
    process.exit(1)
  }
  const n = toNames(raw)
  if (n.name === 'core') throw new Error('"core" is reserved')
  const dest = join(root, 'layers', n.name)
  if (existsSync(dest)) {
    console.error(`layers/${n.name} already exists`)
    process.exit(1)
  }
  const written = []
  copyTree(join(root, 'templates/feature'), dest, n, written)
  console.log(`Created layers/${n.name}:`)
  for (const f of written) console.log(`  ${relative(root, f)}`)
  console.log(`\nNext: add "${n.name}.view" to a role, implement GET /${n.name} in your backend (or the mock), run pnpm dev.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
