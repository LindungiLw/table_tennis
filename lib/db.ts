import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// import { getAuth } from "firebase/auth"; // Ini kita matikan dulu sementara karena belum dipakai

const firebaseConfig = {
  apiKey: "AIzaSyCAnTMcKKVbCb15oHtabaWvYLSnWondMyQ",
  authDomain: "pingpong-club-8e63d.firebaseapp.com",
  projectId: "pingpong-club-8e63d",
  storageBucket: "pingpong-club-8e63d.firebasestorage.app",
  messagingSenderId: "935513074113",
  appId: "1:935513074113:web:bd9951c0e0c64a78322740",
};

// Mencegah error inisialisasi ganda di Next.js
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Export db agar bisa dipanggil dari app/page.tsx
export const db = getFirestore(app);
export const auth = getAuth(app);
