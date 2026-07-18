import { createError, getHeader, type H3Event } from 'h3'
import { getAdminAuth, getAdminFirestore } from '~/server/utils/firebase-admin'

export interface AuthContext {
  uid: string
}

function getBearerToken(event: H3Event): string {
  const authHeader = getHeader(event, 'authorization') || ''
  const [scheme, token] = authHeader.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw createError({ statusCode: 401, message: 'Missing or invalid Authorization header' })
  }
  return token
}

export async function requireAuth(event: H3Event): Promise<AuthContext> {
  const token = getBearerToken(event)
  const decoded = await getAdminAuth().verifyIdToken(token)
  return { uid: decoded.uid }
}

export async function requireStoreManageAccess(
  authUid: string,
  ownerUserId: string,
  storeId: string
): Promise<void> {
  const adminDb = getAdminFirestore()

  // Super admin owning the path can manage.
  if (authUid === ownerUserId) return

  // Otherwise require active manager membership.
  const memberSnap = await adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('members')
    .doc(authUid)
    .get()

  if (!memberSnap.exists) {
    throw createError({ statusCode: 403, message: 'Store membership not found' })
  }

  const member = memberSnap.data() as { status?: string; role?: string } | undefined
  if (member?.status !== 'active' || member?.role !== 'manager') {
    throw createError({ statusCode: 403, message: 'Insufficient store permissions' })
  }
}

export async function requireStoreReadAccess(
  authUid: string,
  ownerUserId: string,
  storeId: string
): Promise<void> {
  const adminDb = getAdminFirestore()
  if (authUid === ownerUserId) return

  const memberSnap = await adminDb
    .collection('users')
    .doc(ownerUserId)
    .collection('stores')
    .doc(storeId)
    .collection('members')
    .doc(authUid)
    .get()

  if (!memberSnap.exists) {
    throw createError({ statusCode: 403, message: 'Store membership not found' })
  }

  const member = memberSnap.data() as { status?: string } | undefined
  if (member?.status !== 'active') {
    throw createError({ statusCode: 403, message: 'Inactive store membership' })
  }
}
