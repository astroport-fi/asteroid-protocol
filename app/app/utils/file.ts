export function toBase64(file: File) {
  return new Promise<string | null>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const data = reader.result as string | null
      if (data) {
        resolve(data.split(',')[1])
      } else {
        resolve(null)
      }
    }
    reader.onerror = reject
  })
}

export function loadImage(imageUrl: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    img.src = imageUrl
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
  })
}
