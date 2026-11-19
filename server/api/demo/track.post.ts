import { defineEventHandler, setResponseStatus } from 'h3'

/**
 * Demo activity used to be stored here. The demo and website no longer write to Firestore, so
 * this only answers 204: tabs opened before the change may still send a last beacon.
 */
export default defineEventHandler((event) => {
  setResponseStatus(event, 204)
  return null
})
