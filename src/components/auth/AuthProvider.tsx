'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/app/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  PhoneAuthProvider,
  RecaptchaVerifier,
  PhoneAuthCredential,
  signInWithCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { User, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  signUp: async () => {},
  sendOTP: async () => undefined,
  verifyOTP: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationId, setVerificationId] = useState<string>('');

  useEffect(() => {
    return auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              name: userData.name || '',
              email: userData.email || '',
              mobile: userData.mobile || '',
              age: userData.age || 0,
              gender: userData.gender || '',
              district: userData.district || '',
              state: userData.state || '',
              createdAt: userData.createdAt?.toDate() || new Date(),
              isAdmin: userData.isAdmin || false
            });
          } else {
            // If user exists in Firebase but not in Firestore, sign them out
            await firebaseSignOut(auth);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          throw new Error('No account found with this email');
        } else if (error.message.includes('wrong-password')) {
          throw new Error('Incorrect password');
        }
      }
      throw new Error('Failed to sign in. Please try again.');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          throw new Error('An account already exists with this email');
        } else if (error.message.includes('weak-password')) {
          throw new Error('Password is too weak. Use at least 6 characters');
        } else if (error.message.includes('invalid-email')) {
          throw new Error('Invalid email address');
        }
      }
      throw new Error('Failed to create account. Please try again.');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  };

  const sendOTP = async (phoneNumber: string) => {
    try {
      // Clean up any existing reCAPTCHA widgets
      const existingRecaptcha = document.querySelector('#recaptcha-container iframe');
      if (existingRecaptcha) {
        existingRecaptcha.remove();
      }

      // Create a new RecaptchaVerifier instance
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          // Reset the reCAPTCHA
          throw new Error('reCAPTCHA expired. Please try again.');
        }
      });

      // Get the verification ID
      const provider = new PhoneAuthProvider(auth);
      const vid = await provider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      setVerificationId(vid);
      return vid;
    } catch (error) {
      console.error('Send OTP error:', error);
      if (error instanceof Error) {
        if (error.message.includes('invalid-phone-number')) {
          throw new Error('Invalid phone number format');
        } else if (error.message.includes('quota-exceeded')) {
          throw new Error('Too many attempts. Please try again later.');
        }
      }
      throw new Error('Failed to send OTP. Please try again.');
    }
  };

  const verifyOTP = async (otp: string) => {
    try {
      if (!verificationId) {
        throw new Error('Please request a new OTP');
      }

      const credential = PhoneAuthProvider.credential(verificationId, otp);
      await signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Verify OTP error:', error);
      if (error instanceof Error) {
        if (error.message.includes('invalid-verification-code')) {
          throw new Error('Invalid OTP code');
        } else if (error.message.includes('code-expired')) {
          throw new Error('OTP has expired. Please request a new one.');
        }
      }
      throw new Error('Failed to verify OTP. Please try again.');
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    sendOTP,
    verifyOTP
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
