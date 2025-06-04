// src/config/firebaseConfig.ts

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import credentials from "../../functions/serviceaccountkey.json";


// Your Firebase Config (Replace with actual values)
const firebaseConfig = {
  apiKey: "AIzaSyBP4KhLB4yvfD_-UXpzBCqUV0edbIpLHac",
  authDomain: "nca-client-app.firebaseapp.com",
  projectId: "nca-client-app",
  storageBucket: "nca-client-app.firebasestorage.app",
  messagingSenderId: "125991137013",
  appId: "1:125991137013:android:f1e942f08eb90f038e1fbc",
};

// Ensure Firebase is only initialized once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
