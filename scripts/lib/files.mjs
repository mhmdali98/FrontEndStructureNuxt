import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SKIP = new Set(['node_modules', '.nuxt', '.output', 'dist', 'coverage', '.git'])

/** Recursively lists files under `dir` matching one of `exts`. */
export function walk(dir, exts) {
  const out = []
  let entries
  try {
    entries = readdirSync(dir)
  }
  catch {
    return out
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) out.push(...walk(full, exts))
    else if (exts.some(e => name.endsWith(e))) out.push(full)
  }
  return out
}

export const read = path => readFileSync(path, 'utf8')
export const rel = (root, path) => relative(root, path)
