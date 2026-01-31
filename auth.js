import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Use the config keys from your Firebase Console screenshot
const firebaseConfig = {
  apiKey: "AIzaSyCbCffbTCQ1yjxR2tfcjpts9E7KUgFFy4o",
  authDomain: "syllabusplus-c30cd.firebaseapp.com",
  projectId: "syllabusplus-c30cd",
  storageBucket: "syllabusplus-c30cd.firebasestorage.app",
  messagingSenderId: "578784187280",
  appId: "1:578784187280:web:efe41016190f1e447f9915"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Login Function
window.loginGoogle = () => {
    signInWithPopup(auth, provider)
        .then(() => { window.location.href = "index.html"; })
        .catch((err) => alert(err.message));
};

// Logout Function
window.logoutUser = () => {
    signOut(auth).then(() => { window.location.reload(); });
};

// Listen for Login State
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.querySelector('.btn-login');
    if (user && loginBtn) {
        loginBtn.innerHTML = "Logout";
        loginBtn.onclick = logoutUser;
    }
});