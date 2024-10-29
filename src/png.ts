export async function svgToPng(svgString: string, size = 160): Promise<string> {
  if (typeof window === 'undefined')
    throw new TypeError('PNG conversion is only supported in browser environment')

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const blobURL = URL.createObjectURL(blob)

  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = blobURL
  })

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('Could not get canvas context')

  ctx.drawImage(img, 0, 0, size, size)

  URL.revokeObjectURL(blobURL)

  return canvas.toDataURL('image/png')
}
