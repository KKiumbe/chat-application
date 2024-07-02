// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyApI3cjbHOSKOaqlimn82JJQo7N7tuwHzY",
    authDomain: "chatapp-eab33.firebaseapp.com",
    projectId: "chatapp-eab33",
    storageBucket: "chatapp-eab33.appspot.com",
    messagingSenderId: "635921141363",
    appId: "1:635921141363:web:a56e9225b6b41311716406"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth()
export const db = getFirestore()
export const storage = getStorage()