import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

/** Starts the production server (mock mode) on `port` and resolves once it answers. */
export async function startServer(root, port, extraEnv = {}) {
  const child = spawn(process.execPath, ['--env-file=.env.mock', '--env-file=.env.e2e', resolve(root, '.output/server/index.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const base = `http://127.0.0.1:${port}`
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`${base}/api/health`)
      if (res.ok) return { base, stop: () => child.kill() }
    }
    catch {
      // not up yet
    }
    await new Promise(r => setTimeout(r, 200))
  }
  child.kill()
  throw new Error('server did not start')
}
