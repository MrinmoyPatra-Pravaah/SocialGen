import { initializeApp, getApps, getApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key])

if (missingKeys.length > 0) {
  throw new Error(
    `Missing Firebase config in frontend environment: ${missingKeys.join(', ')}. Set the matching VITE_FIREBASE_* values in frontend/.env or frontend/.env.local.`
  )
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const storage = getStorage(app)

const authEmulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST
if (authEmulatorHost) {
  const emulatorUrl = authEmulatorHost.startsWith('http://') || authEmulatorHost.startsWith('https://')
    ? authEmulatorHost
    : `http://${authEmulatorHost}`
  connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true })

  // Connect to local storage emulator on port 9199 (default)
  const storageEmulatorHost = import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost:9199'
  const [host, port] = storageEmulatorHost.split(':')
  connectStorageEmulator(storage, host || 'localhost', Number(port || 9199))
}

export { app }
