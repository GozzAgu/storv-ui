import { connectAuthEmulator, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, type FirebaseStorage } from 'firebase/storage'
import {
  FIREBASE_EMULATOR_HOST as HOST,
  FIREBASE_EMULATOR_PORTS as PORTS,
} from '~/utils/firebase-emulator-config'

let enabled = false
const connected = new WeakSet<object>()

/** Set once by the Firebase plugin from `NUXT_PUBLIC_FIREBASE_EMULATORS`. */
export function setFirebaseEmulators(on: boolean) {
  enabled = on
}

export function firebaseEmulatorsEnabled(): boolean {
  return enabled
}

export function withAuthEmulator(auth: Auth): Auth {
  if (enabled && !connected.has(auth)) {
    connectAuthEmulator(auth, `http://${HOST}:${PORTS.auth}`, { disableWarnings: true })
    connected.add(auth)
  }
  return auth
}

/** Must run before the first read or write on this instance. */
export function withFirestoreEmulator(db: Firestore): Firestore {
  if (enabled && !connected.has(db)) {
    connectFirestoreEmulator(db, HOST, PORTS.firestore)
    connected.add(db)
  }
  return db
}

export function withStorageEmulator(storage: FirebaseStorage): FirebaseStorage {
  if (enabled && !connected.has(storage)) {
    connectStorageEmulator(storage, HOST, PORTS.storage)
    connected.add(storage)
  }
  return storage
}
