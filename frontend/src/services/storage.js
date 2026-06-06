import { storage, auth } from '../firebase'
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage'

/**
 * Upload file to Firebase Storage under users/{uid}/{path}
 * @param {File} file - browser File object
 * @param {string} path - relative path e.g. "images/avatar.png"
 * @param {function} onProgress - callback with 0-100 percent
 * @returns {Promise<string>} download URL
 */
export function uploadFile(file, path, onProgress = null) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')

  const storageRef = ref(storage, `users/${uid}/${path}`)
  const task = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      (err) => reject(err),
      async () => {
        const url = await getDownloadURL(task.snapshot.ref)
        resolve(url)
      }
    )
  })
}

/**
 * Delete file from Storage
 * @param {string} path - relative path e.g. "images/avatar.png"
 */
export async function deleteFile(path) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  const storageRef = ref(storage, `users/${uid}/${path}`)
  await deleteObject(storageRef)
}

/**
 * List all files under a folder
 * @param {string} folder - e.g. "images"
 * @returns {Promise<string[]>} array of download URLs
 */
export async function listFiles(folder) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  const folderRef = ref(storage, `users/${uid}/${folder}`)
  const result = await listAll(folderRef)
  const urls = await Promise.all(result.items.map(item => getDownloadURL(item)))
  return urls
}