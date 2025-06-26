import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
// Uses environment variables if provided, otherwise falls back to hardcoded values
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCs7v2dQlqqVvDw3Plxj-KrxjQjltd_8C0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "indiclaw-c00bb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "indiclaw-c00bb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "indiclaw-c00bb.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "784375201916",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:784375201916:web:e3afc731aadb5ba4b589f9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-K5G555YQS6"
};

// Initialize Firebase
let app, analytics, auth, db, storage;

try {
  app = initializeApp(firebaseConfig);
  analytics = getAnalytics(app);
  auth = getAuth(app);
  
  // Setup persistence to keep user logged in
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Auth persistence set to LOCAL");
    })
    .catch((error) => {
      console.error("Error setting auth persistence:", error);
    });
  
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Export the Firebase services
export { app, analytics, auth, db, storage };
