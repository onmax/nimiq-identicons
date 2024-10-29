export async function svgToPng(svgString: string, size: number): Promise<string> {
  if (typeof window === 'undefined')
    throw new TypeError('PNG conversion is only supported in browser environment')

  // Convert SVG string to a blob and create a URL
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const blobURL = URL.createObjectURL(blob)

  // Create an image element and load the SVG from the blob URL
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = blobURL
  })

  // Create a canvas and draw the image on it
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('Could not get canvas context')

  // Draw the SVG image onto the canvas
  ctx.drawImage(img, 0, 0, size, size)

  // Revoke the object URL after drawing
  URL.revokeObjectURL(blobURL)

  // Return base64 PNG data URL
  return canvas.toDataURL('image/png')
}
