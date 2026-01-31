// CHANGE THIS: Use full URLs instead of just names
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Your configuration stays the same
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

// IMPORTANT: Keep attaching to window so your HTML onclick works
window.loginGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => { 
            console.log("Logged in!");
            window.location.href = "index.html"; 
        })
        .catch((error) => {
            console.error(error);
            alert(error.message);
        });
};

window.logoutUser = () => {
    signOut(auth).then(() => { window.location.reload(); });
};

onAuthStateChanged(auth, (user) => {
    const loginBtn = document.querySelector('.btn-login');
    if (user && loginBtn) {
        loginBtn.innerHTML = "Logout";
        loginBtn.onclick = window.logoutUser; // Note: referencing window.logoutUser directly helps
    }
});