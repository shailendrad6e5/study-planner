import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA_Koo_YxstHKIx-LmBh4Rpu4wR0-aCMuk",
  authDomain: "ai-study-planner-4d665.firebaseapp.com",
  projectId: "ai-study-planner-4d665",
  storageBucket: "ai-study-planner-4d665.firebasestorage.app",
  messagingSenderId: "883597533958",
  appId: "1:883597533958:web:6ae59896d06c8af8dab487",
  measurementId: "G-RP5V1R5QRY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
