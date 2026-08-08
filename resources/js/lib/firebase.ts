import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA_oavdZXsSArDqpsiMwh25bbrzyaBcWmQ',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'leonz9000.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'leonz9000',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'leonz9000.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '759403420385',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:759403420385:web:12d07c1774fe0e574075a0',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-BRV1TYP18S',
};

const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(firebaseApp);
