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
        setTimeout(updateNavbarAvatar, 200);
        return;
    }
    
    // Wait a bit more to ensure navbar shadow DOM is ready
    if (!navbar.shadowRoot || !navbar.shadowRoot.querySelector('.avatar')) {
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
            
            // Only update if photoURL exists and is not empty
            // Check if it's a valid URL (starts with http:// or https://)
            if (photoURL && 
                photoURL.trim() !== '' && 
                (photoURL.startsWith('http://') || photoURL.startsWith('https://'))) {
                console.log('Updating navbar avatar with:', photoURL);
                navbar.updateAvatar(photoURL);
            } else {
                // User exists but no valid photoURL, use default
                console.log('No valid photoURL found, using default avatar. photoURL:', photoURL);
                navbar.updateAvatar(DEFAULT_AVATAR);
            }
        } else {
            // User doc doesn't exist, use default
            console.log('User document not found, using default avatar');
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
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for custom elements to be defined
        setTimeout(updateNavbarAvatar, 300);
    });
} else {
    // DOM is already ready, wait a bit for custom elements
    setTimeout(updateNavbarAvatar, 300);
}

// Also listen for when the navbar element is actually connected
const observer = new MutationObserver((mutations) => {
    const navbar = document.querySelector('app-navbar');
    if (navbar && navbar.shadowRoot) {
        updateNavbarAvatar();
        observer.disconnect();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

