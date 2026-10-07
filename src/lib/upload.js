// Image helpers for chef-supplied artwork.
//
// Note for the backend developer: everything here ends up as a downscaled JPEG data URL
// kept on the user record or the menu item. That is fine for a demo and for small logos,
// but real uploads should POST the file to your API and store a served URL instead --
// a data URL never leaves the browser, so other students would not see the chef's logo.

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 // reject anything silly before reading it

/**
 * Read a picked file and return a square, downscaled JPEG data URL.
 * Square + small keeps it comfortably inside the localStorage budget.
 */
export function fileToSquareDataUrl(file, size = 256, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file chosen'))
    if (!file.type?.startsWith('image/')) return reject(new Error('Please choose an image file'))
    if (file.size > MAX_UPLOAD_BYTES) return reject(new Error('That image is too large (max 4 MB)'))

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        // centre-crop to a square so logos and dishes are not squashed
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read')) }
    img.src = url
  })
}

/**
 * A wide crop, for dish photos shown in a 16:10 frame on a kitchen page.
 */
export function fileToWideDataUrl(file, width = 640, ratio = 0.625, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file chosen'))
    if (!file.type?.startsWith('image/')) return reject(new Error('Please choose an image file'))
    if (file.size > MAX_UPLOAD_BYTES) return reject(new Error('That image is too large (max 4 MB)'))

    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const height = Math.round(width * ratio)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        const targetRatio = width / height
        const srcRatio = img.width / img.height
        let sw = img.width
        let sh = img.height
        if (srcRatio > targetRatio) sw = Math.round(img.height * targetRatio)
        else sh = Math.round(img.width / targetRatio)
        const sx = (img.width - sw) / 2
        const sy = (img.height - sh) / 2
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      } catch (e) {
        reject(e)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read')) }
    img.src = url
  })
}

/** First letters of a kitchen name, for the generated logo. */
export const initials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
