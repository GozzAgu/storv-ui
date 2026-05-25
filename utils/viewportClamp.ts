/** Padding from viewport edges for draggable FAB positioning */
export const FAB_VIEWPORT_PAD = 8

/**
 * Clamp a fixed-position element's top-left so it stays inside the viewport
 * (with padding). Used by draggable FAB; pure for unit tests.
 */
export function clampFabPosition(
 left: number,
 top: number,
 elementWidth: number,
 elementHeight: number,
 viewportWidth: number,
 viewportHeight: number,
 pad = FAB_VIEWPORT_PAD
): { left: number; top: number } {
 const maxL = Math.max(pad, viewportWidth - elementWidth - pad)
 const maxT = Math.max(pad, viewportHeight - elementHeight - pad)
 return {
 left: Math.min(Math.max(pad, left), maxL),
 top: Math.min(Math.max(pad, top), maxT),
 }
}
