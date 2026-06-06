import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from '../firebase'
import api from '../services/api'

const googleProvider = new GoogleAuthProvider()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Firebase keeps session alive. This fires on every auth state change.
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { data } = await api.get('/api/auth/me')
          setUser(data)
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return unsubscribe // cleanup on unmount
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const { data } = await api.get('/api/auth/me')
    setUser(data)
    return cred
  }

  async function register(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    // /me auto-creates Firestore user doc on first call
    const { data } = await api.get('/api/auth/me')
    setUser(data)
    return cred
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider)
    const { data } = await api.get('/api/auth/me')
    setUser(data)
    return cred
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
  }

  async function updateProfile(updates) {
    const { data } = await api.put('/api/auth/me', updates)
    setUser(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateProfile, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}