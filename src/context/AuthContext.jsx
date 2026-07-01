import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../services/firebase';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Firestore user data
  const [loading, setLoading] = useState(true);

  // Handle Google Sign-In Redirect Result
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const user = result.user;
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (!docSnap.exists()) {
            await setDoc(docRef, {
              name: user.displayName || 'Student',
              email: user.email,
              createdAt: serverTimestamp(),
              motivationScore: 0,
              streak: 0,
              isNewUser: true,
            });
          }
        } catch (firestoreErr) {
          console.warn('[Auth] Firestore profile creation failed during Google sign-in:', firestoreErr.message);
        }
      }
    }).catch((err) => {
      console.error('Redirect sign-in error:', err);
    });
  }, []);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign up and create Firestore user document
  async function signup(email, password, name) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await sendEmailVerification(user);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        name,
        email,
        createdAt: serverTimestamp(),
        motivationScore: 0,
        streak: 0,
        isNewUser: true,
      });
    } catch (firestoreErr) {
      console.warn('[Auth] Firestore profile creation failed (signup still succeeded):', firestoreErr.message);
    }
    return user;
  }

  // Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Reset Password
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Google Sign-In (Redirect)
  function signInWithGoogle() {
    return signInWithRedirect(auth, googleProvider);
  }

  // Logout
  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  // Load user profile from Firestore
  async function loadUserProfile(uid) {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        setUserProfile(null);
      }
    } catch (err) {
      console.warn('[Auth] Error loading user profile:', err.message);
      setUserProfile(null);
    }
  }

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    resetPassword,
    signInWithGoogle,
    loadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Loading your workspace...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
