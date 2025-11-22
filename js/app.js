'use strict';

// ---------- ROUTE SETTINGS (ABSOLUTE PATHS) ----------
const LOGIN_PATH = '/pages/login.html';
const USER_PATH = '/pages/homepage.html';

// ---------- SPLASH TIMING ----------
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
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

// Best-available persistence with graceful fallbacks
(async () => {
    try {
        await setPersistence(auth, indexedDBLocalPersistence);
    } catch (e1) {
        console.warn('[Auth] IndexedDB persistence failed, falling back:', e1?.message || e1);
        try {
            await setPersistence(auth, browserLocalPersistence);
        } catch (e2) {
            console.warn('[Auth] Local persistence failed, falling back:', e2?.message || e2);
            try {
                await setPersistence(auth, browserSessionPersistence);
            } catch (e3) {
                console.warn('[Auth] Session persistence failed, using in-memory:', e3?.message || e3);
                await setPersistence(auth, inMemoryPersistence);
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
    const here = location.pathname;

    if (user) {
        if (here !== USER_PATH) {
            routed = true;
            location.replace(USER_PATH);
        }
    } else {
        if (here !== LOGIN_PATH) {
            routed = true;
            redirect(LOGIN_PATH, true);
        }
    }
}

// ---------- SPLASH + AUTH FLOW ----------
let latestUser = undefined; // undefined = not resolved yet; null = signed out
let readyToRoute = false;

onAuthStateChanged(auth, (user) => {
    latestUser = user;
    if (readyToRoute) routeByAuth(user);
});

window.addEventListener('load', () => {
    setTimeout(() => {
        readyToRoute = true;
        if (latestUser !== undefined) {
            routeByAuth(latestUser);
            return;
        }
        // Safety: if still unresolved, fall back shortly (uses currentUser)
        const SAFETY_MS = 1200;
        setTimeout(() => {
            if (!routed) routeByAuth(auth.currentUser ?? null);
        }, SAFETY_MS);
    }, SPLASH_MS);
});

// ---- PWA: register the Service Worker ----
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => console.warn('[SW] registration failed', err));
    });
}
