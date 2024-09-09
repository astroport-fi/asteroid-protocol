import sharp from 'sharp'

async function main() {
  const image = sharp('./src/scripts/1.png')
  const imageMetadata = await image.metadata()
  const imageWidth = imageMetadata.width as number
  const imageHeight = imageMetadata.height as number

  const overlayWidth = 485.2

  const relativeCoords = {
    x: 0.49738903394255873,
    y: 0.19451697127937337,
    width: 0.13054830287206268,
    height: 0.10835509138381201,
  }

  const resizedOverlayWidth = Math.floor(relativeCoords.width * imageWidth)
  const x = Math.floor(relativeCoords.x * imageWidth)
  const y = Math.floor(relativeCoords.y * imageHeight)
  const density = (72 * overlayWidth) / resizedOverlayWidth
  console.log(density)

  const overlay = await sharp('./src/scripts/slowblink.svg', { density })
    .resize(resizedOverlayWidth)
    .toBuffer()
  await image
    .composite([
      {
        input: overlay,
        left: x,
        top: y,
      },
    ])
    .png({ quality: 100 })
    .toFile('./output.png')
}

main()
