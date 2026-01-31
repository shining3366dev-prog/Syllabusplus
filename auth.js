// 1. Import the specific functions you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth"; 

// 2. Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCbCffbTCQ1yjxR2tfcjpts9E7kUgFfY4o", // Double check this matches your console exactly
  authDomain: "syllabusplus-c30cd.firebaseapp.com",
  projectId: "syllabusplus-c30cd",
  storageBucket: "syllabusplus-c30cd.firebasestorage.app",
  messagingSenderId: "578784187280",
  appId: "1:578784187280:web:efe41016190f1e447f9915",
  measurementId: "G-FW946RJR52"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // This now works because we imported getAuth
const provider = new GoogleAuthProvider(); // This now works

// 4. Login Function
window.loginGoogle = () => {
    signInWithPopup(auth, provider)
        .then((result) => { 
            console.log("User signed in:", result.user);
            window.location.href = "index.html"; 
        })
        .catch((error) => {
            console.error("Login Error:", error);
            alert(`Error: ${error.message}`);
        });
};

// 5. Logout Function
window.logoutUser = () => {
    signOut(auth).then(() => { 
        console.log("User signed out");
        window.location.reload(); 
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
};

// 6. Listen for Login State
onAuthStateChanged(auth, (user) => {
    const loginBtn = document.querySelector('.btn-login');
    if (user) {
        console.log("Current User:", user.email);
        if (loginBtn) {
            loginBtn.innerHTML = "Logout";
            loginBtn.onclick = logoutUser;
        }
    } else {
        console.log("No user signed in");
    }
});