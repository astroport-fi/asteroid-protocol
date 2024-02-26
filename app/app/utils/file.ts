export function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
  })
}
