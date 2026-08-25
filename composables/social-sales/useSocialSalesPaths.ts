/**
 * Firestore paths for isolated Social Sales collections.
 * users/{ownerUid}/stores/{storeId}/socialLeads/{leadId}
 * users/{ownerUid}/stores/{storeId}/socialEvents/{eventId}
 */

import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

export function getSocialLeadsCollection(
  db: Firestore,
  userId: string,
  storeId: string
): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'socialLeads')
}

export function getSocialLeadDocument(
  db: Firestore,
  userId: string,
  storeId: string,
  leadId: string
): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'socialLeads', leadId)
}

export function getSocialEventsCollection(
  db: Firestore,
  userId: string,
  storeId: string
): CollectionReference {
  return collection(db, 'users', userId, 'stores', storeId, 'socialEvents')
}

export function getSocialEventDocument(
  db: Firestore,
  userId: string,
  storeId: string,
  eventId: string
): DocumentReference {
  return doc(db, 'users', userId, 'stores', storeId, 'socialEvents', eventId)
}
