// @ts-nocheck
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'aethera-duniai.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'aethera-duniai',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'aethera-duniai.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '179102407050',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:179102407050:web:664b807f69c41ee5325073',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-XTB8B36SX1',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let authInstance;

try {
  console.log('--- ATTEMPTING initializeAuth WITH getReactNativePersistence ---');
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log('--- initializeAuth SUCCESS ---');
} catch (error) {
  console.error('--- initializeAuth FAILED! ---', error);
  // Jeśli to Fast Refresh i wywaliło błąd "auth/already-initialized", musimy użyć getAuth(app)
  if (error.code === 'auth/already-initialized') {
    console.log('--- FALLING BACK TO getAuth(app) ---');
    authInstance = getAuth(app);
  } else {
    throw error;
  }
}

export const auth = authInstance;
export const db = getFirestore(app);
