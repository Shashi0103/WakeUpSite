'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface DbUser {
  id: string;
  firebase_uid: string;
  name: string | null;
  email: string;
  is_pro: boolean;
  created_at: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  dbUser: DbUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user with PostgreSQL via backend API
  const syncUserWithDb = async (firebaseUser: FirebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken();
      setToken(idToken);

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDbUser(data.user);
      } else {
        console.error('Failed to sync user with DB:', await response.text());
      }
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  useEffect(() => {
    const IS_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key';

    if (IS_MOCK) {
      setLoading(true);
      const email = localStorage.getItem('mock_active_session');
      if (email) {
        const mockUser = {
          uid: `mock-uid-${email}`,
          displayName: email.split('@')[0],
          email: email,
          emailVerified: true,
          getIdToken: async () => `mock-token-${email}`,
        } as any;
        setUser(mockUser);
        syncUserWithDb(mockUser);
      } else {
        setUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        if (!firebaseUser.emailVerified) {
          setUser(null);
          setDbUser(null);
          setToken(null);
          await signOut(auth);
        } else {
          setUser(firebaseUser);
          await syncUserWithDb(firebaseUser);
        }
      } else {
        setUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    const IS_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key';
    if (IS_MOCK) {
      const email = 'demo@gmail.com';
      const mockUser = {
        uid: `mock-uid-${email}`,
        displayName: 'Demo User',
        email: email,
        emailVerified: true,
        getIdToken: async () => `mock-token-${email}`,
      } as any;
      localStorage.setItem('mock_active_session', email);
      setUser(mockUser);
      await syncUserWithDb(mockUser);
      setLoading(false);
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    const IS_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key';
    if (IS_MOCK) {
      const trimmedEmail = email.trim().toLowerCase();

      const creds = JSON.parse(localStorage.getItem('mock_auth_credentials') || '[]');
      const found = creds.find((c: any) => c.email === trimmedEmail && c.password === pass);
      if (!found) {
        setLoading(false);
        throw new Error('Invalid email or password.');
      }

      if (!found.verified) {
        found.verified = true;
        localStorage.setItem('mock_auth_credentials', JSON.stringify(creds));
        setLoading(false);
        throw new Error('Your email address is not verified. In mock mode, we have automatically verified your account now. Please try logging in again.');
      }

      localStorage.setItem('mock_active_session', trimmedEmail);
      const mockUser = {
        uid: `mock-uid-${trimmedEmail}`,
        displayName: trimmedEmail.split('@')[0],
        email: trimmedEmail,
        emailVerified: true,
        getIdToken: async () => `mock-token-${trimmedEmail}`,
      } as any;
      setUser(mockUser);
      await syncUserWithDb(mockUser);
      setLoading(false);
      return;
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
      if (!userCredential.user.emailVerified) {
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        throw new Error('Your email address is not verified. A verification link has been sent to your inbox (please check your Spam/Junk folder if not found).');
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (name: string, email: string, pass: string) => {
    setLoading(true);
    const IS_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key';
    if (IS_MOCK) {
      const trimmedEmail = email.trim().toLowerCase();

      const creds = JSON.parse(localStorage.getItem('mock_auth_credentials') || '[]');
      if (creds.find((c: any) => c.email === trimmedEmail)) {
        setLoading(false);
        throw new Error('An account with this email already exists.');
      }

      creds.push({ email: trimmedEmail, password: pass, verified: false });
      localStorage.setItem('mock_auth_credentials', JSON.stringify(creds));
      setLoading(false);
      return;
    }

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      await updateProfile(userCredential.user, { displayName: name });
      // Send verification link
      await sendEmailVerification(userCredential.user);
      // Sign out immediately so they must verify first
      await signOut(auth);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    const IS_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key';
    if (IS_MOCK) {
      localStorage.removeItem('mock_active_session');
      setUser(null);
      setDbUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };
  const sendPasswordReset = async (email: string) => {
    const IS_MOCK = process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'placeholder-api-key';
    if (IS_MOCK) {
      console.log(`[Mock Auth] Reset password requested for: ${email}`);
      return;
    }
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        dbUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        logout,
        sendPasswordReset,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
