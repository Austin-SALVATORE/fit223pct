/**
 * Minimal pure-Node PNG decode/encode/stitch for exercise frame strips.
 * Supports 8-bit RGB (color type 2) and RGBA (color type 6) input;
 * outputs 8-bit RGB. No external dependencies.
 */

import { inflateSync, deflateSync } from 'node:zlib'

// ---------- CRC32 (PNG spec) ----------
const CRC_TABLE = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c
}
function crc32(...buffers) {
  let c = 0xffffffff
  for (const buf of buffers)
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

// ---------- decode ----------
const paeth = (a, b, c) => {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/** Decode a PNG buffer to { width, height, rgb } — RGBA is flattened onto white. */
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG')
  let off = 8
  let width = 0, height = 0, bitDepth = 0, colorType = 0
  const idat = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const data = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = data[8]
      colorType = data[9]
      if (data[12] !== 0) throw new Error('interlaced PNG not supported')
    } else if (type === 'IDAT') idat.push(data)
    else if (type === 'IEND') break
    off += 12 + len
  }
  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`)
  const channels = { 2: 3, 6: 4 }[colorType]
  if (!channels) throw new Error(`unsupported color type ${colorType}`)

  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)
  let pos = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[pos++]
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[pos + x]
      const a = x >= channels ? out[y * stride + x - channels] : 0
      const b = y > 0 ? out[(y - 1) * stride + x] : 0
      const c = x >= channels && y > 0 ? out[(y - 1) * stride + x - channels] : 0
      let v
      switch (filter) {
        case 0: v = rawByte; break
        case 1: v = rawByte + a; break
        case 2: v = rawByte + b; break
        case 3: v = rawByte + ((a + b) >> 1); break
        case 4: v = rawByte + paeth(a, b, c); break
        default: throw new Error(`bad filter ${filter}`)
      }
      out[y * stride + x] = v & 0xff
    }
    pos += stride
  }

  if (channels === 3) return { width, height, rgb: out }

  // flatten RGBA onto white
  const rgb = Buffer.alloc(width * height * 3)
  for (let i = 0, j = 0; i < out.length; i += 4, j += 3) {
    const alpha = out[i + 3] / 255
    rgb[j] = Math.round(out[i] * alpha + 255 * (1 - alpha))
    rgb[j + 1] = Math.round(out[i + 1] * alpha + 255 * (1 - alpha))
    rgb[j + 2] = Math.round(out[i + 2] * alpha + 255 * (1 - alpha))
  }
  return { width, height, rgb }
}

// ---------- encode ----------
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(t, data))
  return Buffer.concat([len, t, data, crc])
}

/** Encode raw RGB pixels as a PNG buffer. */
export function encodePngRgb(width, height, rgb) {
  const stride = width * 3
  const raw = Buffer.alloc(height * (stride + 1))
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0 // filter: none
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Stitch same-height PNG buffers into one horizontal strip with white gutters. */
export function stitchHorizontal(pngBuffers, gutter = 32) {
  if (!pngBuffers.length) throw new Error('nothing to stitch')
  const frames = pngBuffers.map(decodePng)
  const height = frames[0].height
  for (const [i, f] of frames.entries())
    if (f.height !== height)
      throw new Error(`frame ${i + 1} height ${f.height} != ${height} — all frames must match`)

  const totalWidth = frames.reduce((w, f) => w + f.width, 0) + gutter * (frames.length - 1)
  const out = Buffer.alloc(totalWidth * height * 3, 0xff) // white
  let xOff = 0
  for (const f of frames) {
    for (let y = 0; y < height; y++)
      f.rgb.copy(out, (y * totalWidth + xOff) * 3, y * f.width * 3, (y + 1) * f.width * 3)
    xOff += f.width + gutter
  }
  return encodePngRgb(totalWidth, height, out)
}
