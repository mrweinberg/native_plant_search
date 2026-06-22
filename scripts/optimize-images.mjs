// Recompress (and downscale) bundled plant thumbnails in place to shrink the
// LCP image and the total image payload. The downloaded JPEGs are saved at very
// high quality (250–320 KB) and some are oversized (e.g. 330×600), but the cards
// and detail page only ever display them at ~140–160px tall. So quality 68 with
// a 460px max dimension is visually ample and cuts each heavy file ~80%.
// A file is touched only if it's over the size threshold OR larger than the max
// dimension, so already-light images are skipped and reruns are cheap (and never
// upscale). Requires macOS `sips`; results are committed.
import { readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'

const DIR = join(process.cwd(), 'public/plants')
const QUALITY = 68
const THRESHOLD = 70 * 1024 // recompress files larger than this
const MAX_DIM = 460 // downscale (never upscale) so the longest side is <= this

function dims(p) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', p], { encoding: 'utf8' })
  const w = Number(/pixelWidth: (\d+)/.exec(out)?.[1])
  const h = Number(/pixelHeight: (\d+)/.exec(out)?.[1])
  return { w, h }
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.jpg'))
let touched = 0
let before = 0
let after = 0
for (const f of files) {
  const p = join(DIR, f)
  const size = statSync(p).size
  const { w, h } = dims(p)
  const tooBig = Math.max(w, h) > MAX_DIM
  if (size < THRESHOLD && !tooBig) continue
  const args = ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(QUALITY)]
  if (tooBig) args.push('-Z', String(MAX_DIM))
  args.push(p, '--out', p)
  execFileSync('sips', args, { stdio: 'ignore' })
  before += size
  after += statSync(p).size
  touched++
}
console.log(
  `optimized ${touched}/${files.length} images: ${(before / 1024 / 1024).toFixed(1)} MB -> ${(after / 1024 / 1024).toFixed(1)} MB`,
)
