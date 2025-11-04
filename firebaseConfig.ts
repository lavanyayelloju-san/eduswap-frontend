// Import the functions you need from the Firebase SDKs
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE ---
// Replace the object below with the `firebaseConfig` object you copied 
// from the Firebase console in Action 1.
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY_HERE",
  authDomain: "PASTE_YOUR_AUTH_DOMAIN_HERE",
  projectId: "PASTE_YOUR_PROJECT_ID_HERE",
  storageBucket: "PASTE_YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "PASTE_YOUR_MESSAGING_SENDER_ID_HERE",
  appId: "PASTE_YOUR_APP_ID_HERE"
};
// ----------------------------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export references to the services you will use
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
