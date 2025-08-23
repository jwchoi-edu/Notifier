// @ts-check
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

const args = process.argv.slice(2)
if (args.length === 0) throw new Error('rm.mjs: No paths provided')

for (const arg of args) {
  const path = join(process.cwd(), arg)
  rm(path, { recursive: true, force: true })
    .then(() => console.log(`rm.mjs: Successfully removed ${path}`))
    .catch((err) => console.error(`rm.mjs: Error removing ${path}:`, err))
}
