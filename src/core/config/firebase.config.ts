import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCxFmYnCniJjpuHSnRJhJkLy6K5ShAjsoc',
  authDomain: 'aethera-duniai.firebaseapp.com',
  projectId: 'aethera-duniai',
  storageBucket: 'aethera-duniai.firebasestorage.app',
  messagingSenderId: '179102407050',
  appId: '1:179102407050:web:664b807f69c41ee5325073',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
