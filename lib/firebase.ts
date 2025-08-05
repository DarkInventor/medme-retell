import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALf7Hkif8KWP1xohFg3c3mCXyurhR2mYs",
  authDomain: "medassist-bb3d7.firebaseapp.com",
  projectId: "medassist-bb3d7",
  storageBucket: "medassist-bb3d7.firebasestorage.app",
  messagingSenderId: "161884728400",
  appId: "1:161884728400:web:240944242ec446a4c07555",
  measurementId: "G-2934ZEGRT9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;