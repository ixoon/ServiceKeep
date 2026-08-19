import fs from 'fs'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const squarePath = 'build/icon-square.png'
const pngPath = 'build/icon.png'
const icoPath = 'build/icon.ico'

await sharp(pngPath).resize(512, 512, { fit: 'cover', position: 'center' }).toFile(squarePath)
await fs.promises.copyFile(squarePath, pngPath)

const buf = await pngToIco(squarePath)
fs.writeFileSync(icoPath, buf)
console.log(`Wrote ${icoPath} (${buf.length} bytes)`)
