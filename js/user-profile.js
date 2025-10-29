// user-profile.js (patched)

// --- Firebase (v9 modular) ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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

// ---------- DOM refs ----------
const profilePhoto = document.querySelector('#profile-photo');
const displayNameEls = document.querySelectorAll('.display-name');
const numberOfPost = document.querySelector('#number-of-post');
const emailEl = document.querySelector('#email');
const currentLocation = document.querySelector('#current-location');
const logOut = document.querySelector('#log-out-btn');

const favoriteBoxInfo = document.querySelector('#favorite-box-info');

const addedBox = document.querySelector('#added-box');
const reviewNumber = document.querySelector('#review-number');
const addedBoxInfo = document.querySelector('#added-box-info');

// Password + toggle
const passwordEl = document.querySelector('#password');
const toggle = document.getElementById('toggle-eye'); // <button id="toggle-eye"> with two icons inside

// ---------- Helpers ----------
function mask(str) {
    return '•'.repeat(Math.max(0, str?.length || 0));
}

// ---------- Firestore: fetch user ----------
async function fetchUsers(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;
        return userSnap.data();
    } catch (err) {
        console.error('fetchUsers error:', err);
        return null;
    }
}

// ---------- Render user info ----------
function showUserInfo(user) {
    if (!user) return;

    // Photo
    if (profilePhoto) {
        profilePhoto.src = user.photoURL || 'default-profile.png';
        profilePhoto.alt = user.displayName || 'Profile photo';
    }

    // Name
    if (displayNameEls?.length) {
        displayNameEls.forEach((el) => {
            el.textContent = user.displayName || 'No name';
        });
    }

    // Email
    if (emailEl) {
        emailEl.textContent = user.email || 'No email';
    }

    // Location
    if (currentLocation) {
        currentLocation.textContent = user.locationName || 'No location';
    }

    // Password + single toggle handler
    if (passwordEl) {
        const original = user.password || '';
        passwordEl.textContent = mask(original);

        if (toggle) {
            // initialize icon state (not toggled = masked)
            toggle.classList.remove('toggled');
            toggle.onclick = () => {
                const isOn = toggle.classList.toggle('toggled');
                passwordEl.textContent = isOn ? original : mask(original);
            };
        }
    }
}

// ---------- Count contributions ----------
async function countUserContribution(userId) {
    let totalComments = 0;
    let totalReviews = 0;
    let totalAddedBox = 0;
    const addedBoxes = [];

    const libraryCollection = collection(db, 'streetLibraries');
    const libraryDocs = await getDocs(libraryCollection);

    libraryDocs.forEach((libraryDoc) => {
        const data = libraryDoc.data();

        if (data.createdBy === userId) {
            totalAddedBox++;
            addedBoxes.push(data);
        }

        if (Array.isArray(data.comments)) {
            data.comments.forEach((c) => {
                if (c?.userId === userId) totalComments++;
            });
        }

        if (Array.isArray(data.reviews)) {
            data.reviews.forEach((r) => {
                if (r?.userId === userId) totalReviews++;
            });
        }
    });

    if (numberOfPost) numberOfPost.textContent = `${totalComments} posts`;
    if (reviewNumber) reviewNumber.textContent = totalReviews;
    if (addedBox) addedBox.textContent = totalAddedBox;

    return { totalComments, totalReviews, totalAddedBox, addedBoxes };
}

// ---------- Favorites ----------
async function getFavorites(userId) {
    const out = [];
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return out;

        const userData = userSnap.data();
        const favorites = Array.isArray(userData.favorites) ? userData.favorites : [];

        for (const fav of favorites) {
            if (!fav?.libraryId) continue;
            const libRef = doc(db, 'streetLibraries', fav.libraryId);
            const libSnap = await getDoc(libRef);
            if (libSnap.exists()) {
                const lib = libSnap.data();
                out.push({
                    libraryId: fav.libraryId,
                    libraryName: lib.name,
                    libraryAddress: lib.address,
                    createdAt: fav.createdAt,
                });
            }
        }
    } catch (e) {
        console.error('getFavorites error:', e);
    }
    return out;
}

async function showFavoriteBoxes(userId) {
    if (!favoriteBoxInfo) return;
    favoriteBoxInfo.innerHTML = '';

    const favs = await getFavorites(userId);
    if (favs.length === 0) {
        favoriteBoxInfo.innerHTML = `<p>No favorite book box.</p>`;
        return;
    }

    favs.forEach((fav) => {
        const div = document.createElement('div');
        div.className = 'favorite-bookbox';
        div.innerHTML = `
      <img src="map-img.png" alt="Map preview">
      <div class="box-detail">
        <p>${fav.libraryName}</p>
        <div class="location-info">
          <i class="fa-solid fa-location-dot"></i>
          <p>${fav.libraryAddress}</p>
        </div>
      </div>
    `;
        favoriteBoxInfo.appendChild(div);
    });
}

// ---------- Added boxes (contributions) ----------
function showAddedBoxes(addedBoxes) {
    if (!addedBoxInfo) return;
    addedBoxInfo.innerHTML = '';

    addedBoxes.forEach((data) => {
        const div = document.createElement('div');
        div.className = 'contribution-box';
        div.innerHTML = `
      <div class="book-box-info">
        <img src="map-img.png" alt="Map preview">
        <div class="box-detail">
          <p>${data.name || 'Book Box'}</p>
          <div class="location-info">
            <i class="fa-solid fa-location-dot"></i>
            <p>${data.address || ''}</p>
          </div>
        </div>
      </div>
    `;
        addedBoxInfo.appendChild(div);
    });
}

// ---------- Main ----------
async function main() {
    // TODO: replace with actual signed-in user id from Auth
    const loginUserId = 'users'; // placeholder used in your earlier code

    const user = await fetchUsers(loginUserId);
    showUserInfo(user);

    const contribution = await countUserContribution(loginUserId);
    showAddedBoxes(contribution.addedBoxes);

    await showFavoriteBoxes(loginUserId);
}

main();
