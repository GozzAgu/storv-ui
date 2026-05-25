declare module 'qrcode' {
 export function toDataURL(text: string, options?: any): Promise<string>
 export function toCanvas(canvas: HTMLCanvasElement, text: string, options?: any): Promise<void>
 export function toString(text: string, options?: any): Promise<string>
}

