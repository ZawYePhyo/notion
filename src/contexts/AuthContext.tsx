import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../services/firebase'
import { Employee, UserRole } from '../types'

interface AuthContextType {
  user: User | null
  employee: Employee | null
  loading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Fetch employee data from Firestore
        try {
          const employeeDoc = await getDoc(doc(db, 'employees', user.uid))
          if (employeeDoc.exists()) {
            setEmployee({ id: employeeDoc.id, ...employeeDoc.data() } as Employee)
          } else {
            console.error('Employee document not found for user:', user.uid)
            setEmployee(null)
          }
        } catch (error) {
          console.error('Error fetching employee data:', error)
          setEmployee(null)
        }
      } else {
        setEmployee(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const value = {
    user,
    employee,
    loading,
    signInWithEmail,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
