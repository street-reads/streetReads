'use strict';

// ---------- ROUTE SETTINGS ----------
const LOGIN_PATH = '../pages/login.html';
const USER_PATH = '../pages/homepage.html';

// ---------- SPLASH TIMING ----------
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const SPLASH_MS = prefersReduced ? 100 : 1200;

// ---------- FIREBASE (CDN, Modular v10+) ----------
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    setPersistence,
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';

// 🔧 Replace with your actual Firebase web config (public-safe)
const firebaseConfig = {
    apiKey: 'AIzaSyDP88zVX_yPRwOKZl_xJxqjph2GFBNuk2o',
    authDomain: 'street-reads.firebaseapp.com',
    projectId: 'street-reads',
    storageBucket: 'street-reads.firebasestorage.app',
    messagingSenderId: '228045832951',
    appId: '1:228045832951:web:4b6d868e05a72ab08a89f2',
    // optional: storageBucket, messagingSenderId, etc.
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Try best persistence → graceful fallbacks (no top-level await)
(async () => {
    try {
        await setPersistence(auth, indexedDBLocalPersistence); // best UX
    } catch (e1) {
        console.warn('[Auth] IndexedDB persistence failed, falling back:', e1?.message || e1);
        try {
            await setPersistence(auth, browserLocalPersistence); // localStorage
        } catch (e2) {
            console.warn('[Auth] Local persistence failed, falling back:', e2?.message || e2);
            try {
                await setPersistence(auth, browserSessionPersistence); // sessionStorage
            } catch (e3) {
                console.warn('[Auth] Session persistence failed, using in-memory:', e3?.message || e3);
                await setPersistence(auth, inMemoryPersistence); // cleared on refresh
            }
        }
    }
})();

// ---------- HELPERS ----------
function redirect(to, includeNext = true) {
    const url = new URL(to, location.origin);
    if (includeNext) {
        const next = location.pathname + location.search + location.hash || '/';
        url.searchParams.set('next', next);
    }
    location.replace(url.toString()); // avoid back-button loops
}

let routed = false;
function routeByAuth(user) {
    if (routed) return;
    if (user) {
        if (location.pathname !== USER_PATH) {
            routed = true;
            location.replace(USER_PATH);
        }
    } else {
        if (location.pathname !== LOGIN_PATH) {
            routed = true;
            redirect(LOGIN_PATH, true);
        }
    }
}

// ---------- SPLASH + AUTH FLOW ----------
let latestUser = undefined; // undefined = not resolved yet; null = signed out
let readyToRoute = false;

// Listen ASAP so we have auth state when splash ends
onAuthStateChanged(auth, (user) => {
    latestUser = user;
    if (readyToRoute) routeByAuth(user);
});

// After page load + short splash, route using latest auth state.
// If auth is still unresolved, use a short safety timeout then decide.
window.addEventListener('load', () => {
    setTimeout(() => {
        readyToRoute = true;

        if (latestUser !== undefined) {
            routeByAuth(latestUser);
            return;
        }

        // Safety: if Firebase is slow, check again shortly (and fall back to currentUser)
        const SAFETY_MS = 1200;
        setTimeout(() => {
            if (!routed) {
                routeByAuth(auth.currentUser ?? null);
            }
        }, SAFETY_MS);
    }, SPLASH_MS);
});

// Optional: helpful console hints
if (firebaseConfig.apiKey === 'YOUR_API_KEY' || firebaseConfig.projectId === 'YOUR_PROJECT_ID') {
    console.warn('[Street Reads] Firebase config placeholders detected. Redirects will not work until you add your real config.');
}
