// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCbCffbTCQ1yjxR2tfcjpts9E7kUgFfY4o",
  authDomain: "syllabusplus-c30cd.firebaseapp.com",
  projectId: "syllabusplus-c30cd",
  storageBucket: "syllabusplus-c30cd.firebasestorage.app",
  messagingSenderId: "578784187280",
  appId: "1:578784187280:web:efe41016190f1e447f9915",
  measurementId: "G-FW946RJR52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
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