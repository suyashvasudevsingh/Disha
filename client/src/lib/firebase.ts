import { initializeApp, getApp, getApps } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyAb6H8YWLLkLL1haAPh3oAKMbqqrGsBuVM',
  authDomain: 'disha-f2d78.firebaseapp.com',
  projectId: 'disha-f2d78',
  storageBucket: 'disha-f2d78.firebasestorage.app',
  messagingSenderId: '61188224628',
  appId: '1:61188224628:web:c7826ef7680b15dc9cc321',
  measurementId: 'G-LC0HQPEP98',
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

if (typeof window !== 'undefined') {
  void setPersistence(firebaseAuth, browserLocalPersistence).catch((error) => {
    console.warn('[firebase] persistence setup failed', error);
  });
}
