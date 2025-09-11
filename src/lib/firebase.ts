
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "studio-9215288788-3958f",
  "appId": "1:96996764351:web:4c9bae50f5aad18c85740a",
  "storageBucket": "studio-9215288788-3958f.firebasestorage.app",
  "apiKey": "AIzaSyA-sdmOHfoGYfqXDUu1VBWcGiYyYCX3xXI",
  "authDomain": "studio-9215288788-3958f.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "96996764351"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
