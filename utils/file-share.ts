export function base64ToBlob(base64: string, mimeType: string): Blob {
 const binary = atob(base64)
 const bytes = new Uint8Array(binary.length)
 for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
 return new Blob([bytes], { type: mimeType })
}

export async function blobToBase64(blob: Blob): Promise<string> {
 return await new Promise((resolve, reject) => {
 const reader = new FileReader()
 reader.onload = () => {
 const result = reader.result as string
 const base64 = result.includes(',') ? result.split(',')[1]! : result
 resolve(base64)
 }
 reader.onerror = () => reject(reader.error)
 reader.readAsDataURL(blob)
 })
}

export function blobToFile(blob: Blob, filename: string): File {
 return new File([blob], filename, { type: blob.type, lastModified: Date.now() })
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
 return await new Promise((resolve, reject) => {
 const reader = new FileReader()
 reader.onload = () => resolve(reader.result as string)
 reader.onerror = () => reject(reader.error)
 reader.readAsDataURL(blob)
 })
}

export function downloadBlob(blob: Blob, filename: string) {
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = filename
 a.click()
 URL.revokeObjectURL(url)
}

export function canShareFiles(files: File[]): boolean {
 if (!import.meta.client || typeof navigator.share !== 'function') return false
 if (typeof navigator.canShare === 'function') {
 try {
 return navigator.canShare({ files })
 } catch {
 return false
 }
 }
 return true
}

export async function shareFilesNative(params: {
 files: File[]
 text?: string
 title?: string
}): Promise<void> {
 await navigator.share({
 files: params.files,
 text: params.text?.trim() || undefined,
 title: params.title,
 })
}

/** Copy PNG/JPEG to clipboard when supported (helps WhatsApp paste flow). */
export async function copyImageBlobToClipboard(blob: Blob): Promise<boolean> {
 if (!import.meta.client || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
 return false
 }
 const type = blob.type.startsWith('image/') ? blob.type : 'image/png'
 try {
 await navigator.clipboard.write([new ClipboardItem({ [type]: blob })])
 return true
 } catch {
 return false
 }
}
