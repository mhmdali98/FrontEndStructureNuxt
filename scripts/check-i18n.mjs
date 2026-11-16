#!/usr/bin/env node
/** Fails when the `en` and `ar` message key sets differ in any layer (or the root). */
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { read } from './lib/files.mjs'

/** Flattens nested messages to dotted keys. */
export function flattenKeys(obj, prefix = '') {
  const keys = []
  for (const [k, v] of Object.entries(obj ?? {})) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) keys.push(...flattenKeys(v, key))
    else keys.push(key)
  }
  return keys
}

export function diffKeys(a, b) {
  const A = new Set(flattenKeys(a))
  const B = new Set(flattenKeys(b))
  return { onlyInFirst: [...A].filter(k => !B.has(k)), onlyInSecond: [...B].filter(k => !A.has(k)) }
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const dirs = [join(root, 'i18n/locales'), ...readdirSync(join(root, 'layers')).map(l => join(root, 'layers', l, 'i18n/locales'))]
  let failed = false
  for (const dir of dirs) {
    if (!existsSync(join(dir, 'en.json'))) continue
    const en = JSON.parse(read(join(dir, 'en.json')))
    const ar = JSON.parse(read(join(dir, 'ar.json')))
    const { onlyInFirst, onlyInSecond } = diffKeys(en, ar)
    for (const k of onlyInFirst) console.error(`${dir}: missing in ar → ${k}`)
    for (const k of onlyInSecond) console.error(`${dir}: missing in en → ${k}`)
    if (onlyInFirst.length || onlyInSecond.length) failed = true
  }
  if (failed) process.exit(1)
  console.log('check-i18n: OK')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
