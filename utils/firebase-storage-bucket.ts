/**
 * Default Storage bucket host when env is unset (must match Firebase Console → Project settings).
 * New projects (late 2024+): *.firebasestorage.app; legacy: *.appspot.com (set NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET explicitly).
 */
export function resolveFirebaseStorageBucket(
 projectId: string,
 fromEnv: string
): string {
 let bucket = (fromEnv || '').trim()
 const pid = (projectId || '').trim()
 if (!bucket && pid) {
 bucket = `${pid}.firebasestorage.app`
 }
 return bucket
}
