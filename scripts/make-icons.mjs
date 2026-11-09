// Renders the dartboard app icon to PNGs (no dependencies).
// Usage: npm run icons
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const BG = [0x0e, 0x14, 0x11]
// [radius as fraction of half-size, color], outermost first
const RINGS = [
  [0.80, [0xe8, 0xdc, 0xc0]],
  [0.62, [0x1a, 0x7f, 0x4b]],
  [0.46, [0xe8, 0xdc, 0xc0]],
  [0.28, [0xc8, 0x31, 0x2f]],
  [0.12, [0x1a, 0x7f, 0x4b]],
  [0.05, [0xc8, 0x31, 0x2f]],
]

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function render(size) {
  const half = size / 2
  const SS = 4 // supersampling for smooth edges
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0]
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const dx = (x + (sx + 0.5) / SS - half) / half
        const dy = (y + (sy + 0.5) / SS - half) / half
        const r = Math.hypot(dx, dy)
        let col = BG
        for (const [rr, c] of RINGS) if (r <= rr) col = c
        acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]
      }
      const o = y * (size * 3 + 1) + 1 + x * 3
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(acc[i] / (SS * SS))
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const s of [180, 192, 512]) {
  writeFileSync(new URL(`../public/icon-${s}.png`, import.meta.url), render(s))
  console.log(`public/icon-${s}.png`)
}
