import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth } from '@/lib/firebase';
import { resetRecaptchaVerifier } from '@/lib/firebase-phone';

export type AuthUser = {
  uid: string;
  phoneNumber: string | null;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  accessToken: string | null;
};

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

type AuthStore = {
  status: AuthStatus;
  user: AuthUser | null;
  pendingPhone: string;
  error: string | null;
  initializeAuth: () => () => void;
  setPendingPhone: (phone: string) => void;
  clearPendingPhone: () => void;
  setAuthError: (error: string | null) => void;
  signOutUser: () => Promise<void>;
};

let unsubscribeAuth: (() => void) | null = null;

function toAuthUser(user: FirebaseUser, accessToken: string | null): AuthUser {
  return {
    uid: user.uid,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    accessToken,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      status: 'checking',
      user: null,
      pendingPhone: '',
      error: null,
      initializeAuth: () => {
        set({ status: 'checking', error: null });

        if (unsubscribeAuth) {
          return unsubscribeAuth;
        }

        unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (fbUser) => {
          try {
            if (!fbUser) {
              set({ user: null, status: 'unauthenticated', error: null });
              return;
            }

            const accessToken = await fbUser.getIdToken();
            set({ user: toAuthUser(fbUser, accessToken), status: 'authenticated', error: null });
          } catch (error) {
            set({ user: null, status: 'unauthenticated', error: error instanceof Error ? error.message : 'Unable to load session' });
          }
        });

        return () => {
          if (unsubscribeAuth) {
            unsubscribeAuth();
            unsubscribeAuth = null;
          }
        };
      },
      setPendingPhone: (phone) => set({ pendingPhone: phone, error: null }),
      clearPendingPhone: () => set({ pendingPhone: '' }),
      setAuthError: (error) => set({ error }),
      signOutUser: async () => {
        try {
          await signOut(firebaseAuth);
          resetRecaptchaVerifier();
        } finally {
          set({ user: null, status: 'unauthenticated', pendingPhone: '', error: null });
        }
      },
    }),
    {
      name: 'disha-auth-flow',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ pendingPhone: state.pendingPhone }),
    }
  )
);
