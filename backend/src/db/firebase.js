import admin from 'firebase-admin'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { createRequire } from 'module'

let db = null

function initFirebase() {
  if (admin.apps.length > 0) return admin.apps[0]

  let credential
  let projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID

  // Option A: path to service account JSON file
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  if (credPath) {
    const absPath = resolve(credPath)
    if (existsSync(absPath)) {
      try {
        const serviceAccount = JSON.parse(readFileSync(absPath, 'utf8'))
        credential = admin.credential.cert(serviceAccount)
        if (!projectId) projectId = serviceAccount.project_id
      } catch (e) {
        console.error('Failed to parse serviceAccountKey:', e.message)
      }
    }
  }

  // Option B: JSON string in env var
  if (!credential && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      credential = admin.credential.cert(serviceAccount)
      if (!projectId) projectId = serviceAccount.project_id
    } catch (e) {
      console.error('FIREBASE_SERVICE_ACCOUNT parse failed:', e.message)
    }
  }

  const emulatorMode =
    process.env.USE_EMULATORS === 'true' ||
    process.env.USE_FIRESTORE_EMULATOR === 'true' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_STORAGE_EMULATOR_HOST

  if (emulatorMode) {
    const resolvedProjectId = projectId || 'socialgen-46c5e'
    return admin.initializeApp({ projectId: resolvedProjectId })
  }

  if (!credential) {
    throw new Error('No Firebase credentials found. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT.')
  }

  return admin.initializeApp({ credential })
}

initFirebase()
db = admin.firestore()

// ─── Generic Helpers ───────────────────────────────────────────

export async function getDoc(collection, id) {
  const snap = await db.collection(collection).doc(id).get()
  if (!snap.exists) return null
  return { id: snap.id, ...snap.data() }
}

export async function setDoc(collection, id, data) {
  await db.collection(collection).doc(id).set(data, { merge: true })
  return { id, ...data }
}

export async function addDoc(collection, data) {
  const ref = await db.collection(collection).add({
    ...data,
    created_at: Date.now(),
  })
  return { id: ref.id, ...data }
}

export async function createDoc(collection, data, id = null) {
  const docId = id ? String(id) : String(Date.now() + Math.floor(Math.random() * 1000))
  await db.collection(collection).doc(docId).set(data)
  return { id: docId, ...data }
}

export async function updateDoc(collection, id, data) {
  await db.collection(collection).doc(id).update(data)
  return { id, ...data }
}

export async function deleteDoc(collection, id) {
  await db.collection(collection).doc(id).delete()
  return { id }
}

export async function queryCollection(collection, filters = [], orderByField = null, limitN = null) {
  let q = db.collection(collection)
  for (const [field, op, value] of filters) {
    q = q.where(field, op, value)
  }
  if (orderByField) q = q.orderBy(orderByField, 'desc')
  if (limitN) q = q.limit(limitN)
  const snap = await q.get()
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export { db }
export default admin