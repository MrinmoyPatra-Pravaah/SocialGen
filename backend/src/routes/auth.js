import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getDoc, setDoc } from '../db/firebase.js'

const router = Router()

// GET /api/auth/me
// Returns user profile. Creates Firestore doc on first login.
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { id: uid, email } = req.user
    let user = await getDoc('users', uid)

    if (!user) {
      // First login — auto-provision user doc
      user = await setDoc('users', uid, {
        email,
        brand_voice: '',
        gemini_api_key: '',
        created_at: Date.now(),
      })
    }

    res.json({
      id: uid,
      email: user.email,
      brand_voice: user.brand_voice || '',
      gemini_api_key: user.gemini_api_key || '',
      created_at: user.created_at,
    })
  } catch (err) {
    console.error('GET /me error:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

// PUT /api/auth/me
// Update profile fields (brand_voice, gemini_api_key, etc.)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { id: uid } = req.user
    const { brand_voice, gemini_api_key } = req.body

    const updates = {}
    if (brand_voice !== undefined) updates.brand_voice = brand_voice
    if (gemini_api_key !== undefined) updates.gemini_api_key = gemini_api_key
    updates.updated_at = Date.now()

    await setDoc('users', uid, updates)

    const user = await getDoc('users', uid)
    res.json({ id: uid, ...user })
  } catch (err) {
    console.error('PUT /me error:', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

export default router