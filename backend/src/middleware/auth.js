import admin from '../db/firebase.js'

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' })
  }

  const token = authHeader.split('Bearer ')[1]

  try {
    const decoded = await admin.auth().verifyIdToken(token)
    const currentUser = {
      id: decoded.uid,
      email: decoded.email,
    }
    req.user = currentUser
    req.currentUser = currentUser
    next()
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const requireAuth = authMiddleware