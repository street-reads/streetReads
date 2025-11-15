// update-navbar-avatar.js
// Updates the navbar avatar with the logged-in user's profile picture from Firebase

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyDP88zVX_yPRwOKZl_xJxqjph2GFBNuk2o',
    authDomain: 'street-reads.firebaseapp.com',
    projectId: 'street-reads',
    storageBucket: 'street-reads.firebasestorage.app',
    messagingSenderId: '228045832951',
    appId: '1:228045832951:web:4b6d868e05a72ab08a89f2',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Default fallback avatar
const DEFAULT_AVATAR = '../src/avatar.png';

// Function to update navbar avatar
async function updateNavbarAvatar() {
    const navbar = document.querySelector('app-navbar');
    if (!navbar) {
        // Navbar might not be loaded yet, try again after a short delay
        setTimeout(updateNavbarAvatar, 100);
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        // No user logged in, use default avatar
        navbar.updateAvatar(DEFAULT_AVATAR);
        return;
    }

    try {
        // Fetch user data from Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            const photoURL = userData.photoURL;
            
            if (photoURL) {
                navbar.updateAvatar(photoURL);
            } else {
                // User exists but no photoURL, use default
                navbar.updateAvatar(DEFAULT_AVATAR);
            }
        } else {
            // User doc doesn't exist, use default
            navbar.updateAvatar(DEFAULT_AVATAR);
        }
    } catch (error) {
        console.error('Error fetching user photo:', error);
        // On error, use default avatar
        navbar.updateAvatar(DEFAULT_AVATAR);
    }
}

// Listen to auth state changes and update avatar accordingly
onAuthStateChanged(auth, (user) => {
    updateNavbarAvatar();
});

// Also try to update when DOM is ready (in case user is already logged in)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavbarAvatar);
} else {
    // DOM is already ready
    updateNavbarAvatar();
}

