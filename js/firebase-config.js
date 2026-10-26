import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAwb8imMQ_WtL7Lp56wo8P8EHBlS4OxtMI",
  authDomain: "web-worldbd.firebaseapp.com",
  projectId: "web-worldbd",
  storageBucket: "web-worldbd.firebasestorage.app",
  messagingSenderId: "255296358027",
  appId: "1:255296358027:web:b2bf1baf074f62aa06768e",
  measurementId: "G-KRHD6HY3Z6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, googleProvider, db };
