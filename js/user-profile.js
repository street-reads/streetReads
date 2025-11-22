// user-profile.js (patched, Auth-aware, inline eye shows password; modal opens via edit icon only)

// --- Firebase (v9 modular) ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    deleteUser,
    updatePassword,
    updateEmail,
    updateProfile,
    reauthenticateWithCredential,
    EmailAuthProvider,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
} from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';

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
const trashIcon = document.querySelector('#trash-icon');
const logOut = document.querySelector('#log-out-btn');

const favoriteBoxInfo = document.querySelector('#favorite-box-info');

const addedBox = document.querySelector('#added-box');
const reviewNumber = document.querySelector('#review-number');
const addedBoxInfo = document.querySelector('#added-box-info');

// Password (profile section – display only)
const passwordEl = document.querySelector('#password');
const toggle = document.getElementById('toggle-eye'); // button wrapping eye icons

// Modal refs
const editIcon = document.querySelector('.fa-pen');
const editModal = document.querySelector('#editModal');
const closeIcon = document.querySelector('.fa-xmark');
const modalPhoto = document.querySelector('#modalPhoto');
const camera = document.querySelector('.fa-camera');
const editName = document.querySelector('#editName');
const editEmail = document.querySelector('#editEmail');
const editLocation = document.querySelector('#editLocation');
const editPassword = document.querySelector('#editPassword'); // NEW password (never prefilled)
const saveBtn = document.querySelector('#saveBtn');

// Optional password reveal in the EDIT MODAL
const editPwdToggle = document.getElementById('editPwdToggle');
const editPwdEye = document.getElementById('editPwdEye');
const editPwdEyeOff = document.getElementById('editPwdEyeOff');

// ---------- Helpers ----------
function mask(str) {
    return '•'.repeat(Math.max(0, str?.length || 0));
}

/** Attach a show/hide toggle to a password input */
function attachPasswordToggle(input, toggleBtn, eyeOn, eyeOff) {
    if (!input || !toggleBtn) return;

    const setState = (show) => {
        input.type = show ? 'text' : 'password';
        toggleBtn.setAttribute('aria-pressed', String(show));
        if (eyeOn && eyeOff) {
            eyeOn.style.display = show ? 'none' : 'inline';
            eyeOff.style.display = show ? 'inline' : 'none';
        }
    };
    setState(false);
    toggleBtn.addEventListener('click', () => {
        const show = toggleBtn.getAttribute('aria-pressed') !== 'true';
        setState(show);
    });
}

async function reauthIfNeeded(currentUser) {
    const pw = window.prompt('Please enter your current password to confirm these changes:');
    if (!pw) throw new Error('reauth-cancelled');
    const cred = EmailAuthProvider.credential(currentUser.email, pw);
    await reauthenticateWithCredential(currentUser, cred);
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

// keep the original Firestore password (if present) for inline reveal
let originalPassword = '';

// ---------- Render user info ----------
function showUserInfo(user) {
    if (!user) return;

    // Photo
    if (profilePhoto) {
        profilePhoto.src = user.photoURL || 'https://res.cloudinary.com/dlsdg0urv/image/upload/v1763164659/tffgil0ykc9fjimshlve.png';
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

    // Password (inline reveal with eye; NO modal open here)
    originalPassword = user.password || ''; // will be empty if you don't store it
    if (passwordEl) {
        // start masked
        passwordEl.textContent = mask(originalPassword);

        if (toggle) {
            toggle.classList.remove('toggled');
            toggle.onclick = () => {
                const isOn = toggle.classList.toggle('toggled');
                passwordEl.textContent = isOn ? originalPassword : mask(originalPassword);
            };
        }
    }
}

// ---------- Update profile photo ----------
if (camera) {
    camera.addEventListener('click', async () => {
        if (!currentUser) {
            alert('Please login');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.click();

        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;

            try {
                const { cloudName, uploadPreset, apiUrl } = window.cloudinaryConfig || {};
                if (!cloudName || !uploadPreset || !apiUrl) {
                    alert('Upload config missing.');
                    return;
                }

                const uploadUrl = `${apiUrl}/${cloudName}/image/upload`;
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', uploadPreset);

                const res = await fetch(uploadUrl, { method: 'POST', body: formData });
                const data = await res.json();

                if (!data.secure_url) {
                    alert('Upload failed');
                    return;
                }
                const photoURL = data.secure_url;

                // Store photoURL in firestore
                const userRef = doc(db, 'users', currentUser.uid);
                await updateDoc(userRef, { photoURL });

                if (modalPhoto) modalPhoto.src = photoURL;
                if (profilePhoto) profilePhoto.src = photoURL;

                // Notify navbar (if it exposes updateAvatar)
                const navbar = document.querySelector('app-navbar');
                if (navbar && typeof navbar.updateAvatar === 'function') {
                    navbar.updateAvatar(photoURL);
                }

                alert('Uploaded successfully');
            } catch (error) {
                console.error('Upload error: ', error);
                alert('Error');
            }
        };
    });
}

// ---------- Delete user account ----------
if (trashIcon) {
    trashIcon.addEventListener('click', async () => {
        if (!currentUser) return;

        const deletingUser = confirm('Are you sure you want to delete your account?');
        if (!deletingUser) return;

        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await deleteDoc(userRef);
            await signOut(auth);

            alert('Your account has been deleted');
            window.location.href = '../pages/login.html';
        } catch (error) {
            console.error('Deleting error', error);
            alert('Failed to delete account');
        }
    });
}

// ---------- Count contributions ----------
async function countUserContribution(userId, userDisplayName) {
    let totalComments = 0;
    let totalReviews = 0;
    let totalAddedBox = 0;
    const addedBoxes = [];

    const libraryCollection = collection(db, 'streetLibraries');
    const libraryDocs = await getDocs(libraryCollection);
    const docsArray = libraryDocs.docs;

    docsArray.forEach((libraryDoc) => {
        const data = libraryDoc.data();
        const libraryId = libraryDoc.id;

        if (data.createdBy === userId) {
            totalAddedBox++;
            addedBoxes.push({ ...data, libraryId });
        }

        if (Array.isArray(data.comments)) {
            data.comments.forEach((c) => {
                if (c?.userId === userId) totalComments++;
            });
        }

        if (Array.isArray(data.reviews)) {
            data.reviews.forEach((r) => {
                const isUserReview =
                    r?.userId === userId ||
                    (r?.reviewerName && userDisplayName && r.reviewerName.trim().toLowerCase() === userDisplayName.trim().toLowerCase());

                if (isUserReview) totalReviews++;
            });
        }
    });

    if (numberOfPost) numberOfPost.textContent = `${totalComments}`;
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

        for (const libraryId of favorites) {
            if (!libraryId) continue;
            const libRef = doc(db, 'streetLibraries', libraryId);
            const libSnap = await getDoc(libRef);
            if (libSnap.exists()) {
                const lib = libSnap.data();
                out.push({
                    libraryId,
                    libraryName: lib.name || 'Unknown name',
                    libraryAddress: lib.address || 'No address',
                });
            }
        }
    } catch (_) {}
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
      <div class="book-box-info">
        <img src="../src/0416f2714b3089cc44ed528f4660a254f40afa73.png" alt="Map preview" class="box-thumbnail">
        <div class="box-detail">
          <p class="box-name">${fav.libraryName}</p>
          <div class="box-location">
            <i class="fa-solid fa-location-dot"></i>
            <span>${fav.libraryAddress || 'Location'}</span>
          </div>
        </div>
      </div>
    `;
        div.addEventListener('click', () => {
            window.location.href = `bookBoxDetail.html?id=${fav.libraryId}`;
        });
        favoriteBoxInfo.appendChild(div);
    });
}

// ---------- Added boxes (contributions) ----------
function showAddedBoxes(addedBoxes) {
    if (!addedBoxInfo) return;
    addedBoxInfo.innerHTML = '';

    if (addedBoxes.length === 0) {
        addedBoxInfo.innerHTML = '<p class="no-contributions">No book boxes added yet.</p>';
        return;
    }

    addedBoxes.forEach((data) => {
        const div = document.createElement('div');
        div.className = 'contribution-box';

        const mapThumbnail = `<img src="../src/0416f2714b3089cc44ed528f4660a254f40afa73.png" alt="Map preview" class="box-thumbnail">`;

        div.innerHTML = `
      <div class="book-box-info">
        ${mapThumbnail}
        <div class="box-detail">
          <p class="box-name">${data.name || 'Book Box'}</p>
          <div class="box-location">
            <i class="fa-solid fa-location-dot"></i>
            <span>${data.address || 'Location'}</span>
          </div>
        </div>
      </div>
    `;
        div.style.cursor = 'pointer';
        div.addEventListener('click', () => {
            window.location.href = `bookBoxDetail.html?id=${data.libraryId}`;
        });
        addedBoxInfo.appendChild(div);
    });
}

// ---------- Main ----------
async function main(userId) {
    const user = await fetchUsers(userId);
    showUserInfo(user);

    const userDisplayName = user?.displayName || currentUser?.displayName || '';
    const contribution = await countUserContribution(userId, userDisplayName);
    showAddedBoxes(contribution.addedBoxes);

    await showFavoriteBoxes(userId);
}

// Store current user globally
let currentUser = null;

// auth state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await main(user.uid);
    } else {
        window.location.href = '../pages/login.html';
    }
});

// logout
if (logOut) {
    logOut.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = '../pages/login.html';
        } catch (e) {
            console.error('Logout error: ', e);
        }
    });
}

// ---------- Modal window ----------
if (editIcon) {
    editIcon.addEventListener('click', async () => {
        if (!editModal) return;
        editModal.classList.add('show');

        if (!currentUser) return;

        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        const defo_photo = 'https://res.cloudinary.com/dlsdg0urv/image/upload/v1763164659/tffgil0ykc9fjimshlve.png';

        if (userSnap.exists()) {
            const data = userSnap.data();

            if (modalPhoto) {
                modalPhoto.src = data.photoURL || defo_photo;
            }

            if (editName) editName.value = data.displayName || '';
            if (editEmail) editEmail.value = data.email || '';
            if (editLocation) editLocation.value = data.locationName || '';
            if (editPassword) editPassword.value = ''; // NEVER prefill existing password

            // Reset modal password field to hidden & reset eye state
            if (editPassword && editPwdToggle) {
                editPassword.type = 'password';
                editPwdToggle.setAttribute('aria-pressed', 'false');
                if (editPwdEye && editPwdEyeOff) {
                    editPwdEye.style.display = 'inline';
                    editPwdEyeOff.style.display = 'none';
                }
            }
        }
    });
}

if (closeIcon && editModal) {
    closeIcon.addEventListener('click', () => editModal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.remove('show');
    });
}

// Attach the modal password eye behavior once
attachPasswordToggle(editPassword, editPwdToggle, editPwdEye, editPwdEyeOff);

// ---------- Save (AUTH-FIRST, then Firestore mirror) ----------
if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            alert('Please log in to edit your profile.');
            return;
        }

        const userRef = doc(db, 'users', currentUser.uid);

        const newName = (editName?.value || '').trim();
        const newEmail = (editEmail?.value || '').trim();
        const newLocation = (editLocation?.value || '').trim();
        const newPassword = (editPassword?.value || '').trim();

        try {
            const wantsEmailChange = newEmail && newEmail !== currentUser.email;
            const wantsPasswordChange = !!newPassword;

            // Reauth if changing sensitive data
            if (wantsEmailChange || wantsPasswordChange) {
                await reauthIfNeeded(currentUser);
            }

            // Update Auth
            if (wantsEmailChange) {
                await updateEmail(currentUser, newEmail);
            }
            if (wantsPasswordChange) {
                await updatePassword(currentUser, newPassword);
            }
            if (newName && newName !== (currentUser.displayName || '')) {
                await updateProfile(currentUser, { displayName: newName });
            }

            // Mirror safe fields to Firestore (NEVER store password)
            const updates = {
                displayName: newName || currentUser.displayName || null,
                locationName: newLocation || null,
                email: currentUser.email, // authoritative from Auth
            };
            await updateDoc(userRef, updates);

            // UI updates
            displayNameEls.forEach((el) => (el.textContent = updates.displayName || 'No name'));
            if (emailEl) emailEl.textContent = updates.email || 'No email';
            if (currentLocation) currentLocation.textContent = updates.locationName || 'No location';

            // Always keep the summary masked
            if (passwordEl) passwordEl.textContent = mask(originalPassword);
            if (toggle) toggle.classList.remove('toggled');

            // Clear modal password field
            if (editPassword) editPassword.value = '';

            alert('Profile updated successfully');
            if (editModal) editModal.classList.remove('show');
        } catch (error) {
            console.error('Update failed:', error);
            let msg = 'Failed to update.';
            if (error.code === 'auth/requires-recent-login') {
                msg = 'Please sign in again to confirm these changes.';
            } else if (error.code === 'auth/weak-password') {
                msg = 'Password is too weak. Use at least 6–8 strong characters.';
            } else if (error.code === 'reauth-cancelled') {
                msg = 'Update canceled — reauthentication required.';
            }
            alert(msg);
        }
    });
}
