// --- Firebase init (ADD THIS) ---
import {
    getFirestore,
    getDocs,
    collection,
    addDoc,
    updateDoc,
    serverTimestamp,
    GeoPoint,
    onSnapshot,
} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';

const firebaseConfig = {
    apiKey: 'AIzaSyDP88zVX_yPRwOKZl_xJxqjph2GFBNuk2o',
    authDomain: 'street-reads.firebaseapp.com',
    projectId: 'street-reads',
    storageBucket: 'street-reads.firebasestorage.app',
    messagingSenderId: '228045832951',
    appId: '1:228045832951:web:4b6d868e05a72ab08a89f2',
};

document.addEventListener('profile', () => {
    window.location.href = '/pages/user-profile.html';
});
// map + marker registry
let appMap = null;
const markersById = new Map();

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// --- end Firebase init ---

const apiKey = 'CL5Ni3mQjMRBsIchbKD6ousDrxTwSSQI';

/* ===== BookBoxes demo (optional) ===== */
const BOOKBOXES = [
    {
        id: 'lib_001',
        name: 'Kitsilano Community Book Exchange',
        address: '2150 W 4th Ave, Vancouver, BC',
        coords: [-123.1568, 49.2659],
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
        averageRating: 4.6,
    },
];

/* ===== helpers ===== */
const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
function requireSecure(featureName) {
    if (!(window.isSecureContext || isLocalhost)) {
        alert(`${featureName} requires HTTPS or http://localhost`);
        return false;
    }
    return true;
}

/* Normalize various location shapes to [lng, lat] */
function normalizeLocationToLngLat(loc) {
    if (!loc) return null;
    if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') return [loc.longitude, loc.latitude];
    if (typeof loc.lat === 'number' && typeof loc.lng === 'number') return [loc.lng, loc.lat];
    if (Array.isArray(loc) && loc.length === 2) {
        const a = Number(loc[0]);
        const b = Number(loc[1]);
        if (Number.isFinite(a) && Number.isFinite(b)) {
            if (a >= -90 && a <= 90 && (b < -90 || b > 90)) return [b, a];
            return [a, b];
        }
    }
    if (typeof loc === 'string') {
        const parts = loc.split(',').map((s) => Number(s.trim()));
        if (parts.length === 2 && parts.every(Number.isFinite)) {
            const [lat, lng] = parts;
            return [lng, lat];
        }
    }
    return null;
}

/* Popup content (photo + rating) */
function buildPopupEl(item) {
    const el = document.createElement('div');
    el.className = 'sr-popup';
    const ratingText = typeof item.averageRating === 'number' ? item.averageRating.toFixed(1) : '—';
    el.innerHTML = `
    <div class="ttl">${item.name || 'BookBox'}</div>
    ${item.photo ? `<img class="img" src="${item.photo}" alt="">` : ''}
    <div class="addr"><span class="icon">📍</span><span>${item.address || ''}</span></div>
    <div class="meta"><span class="icon">⭐</span><span>${ratingText}</span></div>
  `;
    return el;
}

/* Add/Update/Remove markers from Firestore docs */
function addOrUpdateMarkerFromDoc(map, docSnap) {
    const id = docSnap.id;
    const data = docSnap.data() || {};

    const coords = normalizeLocationToLngLat(data.location);
    if (!coords) return;

    const item = {
        id,
        name: data.name || 'BookBox',
        address: data.address || '',
        averageRating: typeof data.averageRating === 'number' ? data.averageRating : null,
        photo: Array.isArray(data.photoURL) && data.photoURL.length ? data.photoURL[0] : null,
        coords,
    };

    if (markersById.has(id)) {
        const entry = markersById.get(id);
        entry.marker.setLngLat(coords);
        entry.popup.setDOMContent(buildPopupEl(item));
    } else {
        const el = document.createElement('div');
        el.className = 'marker-bookbox';
        const popup = new tt.Popup({ offset: 30 }).setDOMContent(buildPopupEl(item));
        // anchor bottom so the pin points to the coordinate and the SDK can handle placement
        const marker = new tt.Marker({ element: el, anchor: 'bottom' }).setLngLat(coords).setPopup(popup).addTo(map);
        markersById.set(id, { marker, popup });
    }
}

function removeMarkerById(id) {
    const entry = markersById.get(id);
    if (!entry) return;
    try {
        entry.marker.remove();
    } catch {}
    markersById.delete(id);
}

/* Live Firestore -> map markers (top-level streetLibraries) */
function startLibraryMarkersLive(map) {
    const colRef = collection(db, 'streetLibraries');
    return onSnapshot(
        colRef,
        (snap) => {
            snap.docChanges().forEach((ch) => {
                if (ch.type === 'added' || ch.type === 'modified') {
                    addOrUpdateMarkerFromDoc(map, ch.doc);
                } else if (ch.type === 'removed') {
                    removeMarkerById(ch.doc.id);
                }
            });
        },
        (err) => console.error('streetLibraries onSnapshot error:', err)
    );
}

/* Add demo markers */
function addBookboxMarkers(map, items) {
    items.forEach((item) => {
        const ll = normalizeLocationToLngLat(item.coords || item.location);
        if (!ll) return;
        const markerEl = document.createElement('div');
        markerEl.className = 'marker-bookbox';
        const popup = new tt.Popup({ offset: 30 }).setDOMContent(buildPopupEl(item));
        new tt.Marker({ element: markerEl, anchor: 'bottom' }).setLngLat(ll).setPopup(popup).addTo(map);
    });
}

/* Show your location (pulsing green) + zoom to it) */
function showUserLocation(map, { zoom = 17, follow = false, bounds } = {}) {
    if (!requireSecure('Geolocation')) return;
    if (!('geolocation' in navigator)) {
        console.warn('Geolocation not supported.');
        return;
    }

    function getMarker() {
        if (!showUserLocation._marker) {
            const el = document.createElement('div');
            el.className = 'marker-you';
            showUserLocation._marker = new tt.Marker({ element: el });
        }
        return showUserLocation._marker;
    }

    let watchId = null;
    let firstFix = false;

    function onPos({ coords }) {
        const you = [coords.longitude, coords.latitude];
        getMarker().setLngLat(you).addTo(map);

        if (bounds && !bounds.isEmpty()) {
            bounds.extend(you);
            map.fitBounds(bounds, { padding: 80, maxZoom: zoom, duration: 600 });
        } else if (!firstFix || follow) {
            map.easeTo({ center: you, zoom, duration: 600 });
        }
        firstFix = true;

        if (!follow && watchId != null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }
    function onErr(err) {
        console.warn('Geolocation error:', err?.code, err?.message);
        if (err?.code === 1) alert('Location permission blocked. Enable it in your browser/OS settings.');
    }

    navigator.geolocation.getCurrentPosition(onPos, onErr, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
    });
    try {
        watchId = navigator.geolocation.watchPosition(onPos, onErr, {
            enableHighAccuracy: true,
            maximumAge: 0,
        });
    } catch {}
}

// Geocode a human-readable address → { lat, lng } using TomTom Search API
async function geocodeAddress(address) {
    const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(address)}.json?key=${apiKey}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    const pos = data?.results?.[0]?.position;
    if (!pos || typeof pos.lat !== 'number' || typeof pos.lon !== 'number') {
        throw new Error('Address not found');
    }
    return { lat: pos.lat, lng: pos.lon }; // TomTom returns {lat, lon}
}

/* ---------- NEW: Address autocomplete (typeahead) ---------- */
function enableAddressAutocomplete(addressInput) {
    // ensure a datalist exists and the input points to it
    let list = document.getElementById('addressSuggestions');
    if (!list) {
        list = document.createElement('datalist');
        list.id = 'addressSuggestions';
        document.body.appendChild(list);
    }
    if (!addressInput.getAttribute('list')) {
        addressInput.setAttribute('list', 'addressSuggestions');
    }

    // keep the last chosen suggestion’s coords to skip re-geocoding
    let chosen = null;
    addressInput._chosenCoords = null; // {lat,lng} or null

    const DEBOUNCE_MS = 250;
    let t = null;

    addressInput.addEventListener('input', () => {
        addressInput._chosenCoords = null; // reset if user edits
        chosen = null;

        const q = addressInput.value.trim();
        if (t) clearTimeout(t);
        if (q.length < 3) {
            list.innerHTML = '';
            return;
        }

        t = setTimeout(async () => {
            try {
                const url =
                    `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json` + `?key=${apiKey}&typeahead=true&limit=6&countrySet=CA,US`;
                const res = await fetch(url);
                if (!res.ok) return;
                const data = await res.json();
                const results = Array.isArray(data.results) ? data.results : [];

                // Fill datalist with freeform addresses
                list.innerHTML = results
                    .map((r) => {
                        const addr = r.address?.freeformAddress || r.poi?.name || '';
                        // Encode coords into data attributes by placing a delimiter – we’ll resolve on change
                        const lat = r.position?.lat;
                        const lon = r.position?.lon;
                        return addr && typeof lat === 'number' && typeof lon === 'number' ? `<option value="${addr}"></option>` : '';
                    })
                    .join('');
                // Keep a small side map from address string -> coords
                enableAddressAutocomplete._cache = new Map(
                    results
                        .filter((r) => r.address?.freeformAddress && r.position)
                        .map((r) => [r.address.freeformAddress, { lat: r.position.lat, lng: r.position.lon }])
                );
            } catch (e) {
                // swallow network errors silently
            }
        }, DEBOUNCE_MS);
    });

    // When user commits a value (blur or change), see if it matches a suggestion
    function resolveChosen() {
        const val = addressInput.value.trim();
        const cached = enableAddressAutocomplete._cache?.get(val);
        if (cached) {
            addressInput._chosenCoords = cached; // store on the input element
            chosen = cached;
        }
    }
    addressInput.addEventListener('change', resolveChosen);
    addressInput.addEventListener('blur', resolveChosen);
}

/* CREATE a new doc with GeoPoint; prefers preselected coordinates from autocomplete */
async function createLibrary({ name, address, coords }) {
    const { lat, lng } = coords ?? (await geocodeAddress(address));
    const payload = {
        name: name ?? null,
        address: address ?? null,
        libraryId: null,
        createdBy: null,
        location: new GeoPoint(lat, lng),
        photoURL: [],
        comments: [],
        reviews: [],
        averageRating: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    const colRef = collection(db, 'streetLibraries');
    const docRef = await addDoc(colRef, payload);
    await updateDoc(docRef, { libraryId: docRef.id });
    return docRef.id;
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('Initializing map...');

    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }
    if (typeof tt === 'undefined') {
        console.error('TomTom SDK not loaded!');
        return;
    }

    try {
        const map = tt.map({
            key: apiKey,
            container: mapContainer,
            center: [-123.10904462328836, 49.22895825651896],
            zoom: 12,
        });

        map.addControl(new tt.NavigationControl());
        map.addControl(new tt.FullscreenControl());

        appMap = map;

        addBookboxMarkers(map, BOOKBOXES);
        showUserLocation(map, { zoom: 16, follow: false });
        startLibraryMarkersLive(map);

        console.log('Map initialized successfully!');
    } catch (error) {
        console.error('Error creating map:', error);
    }

    filterPopup();
    addBookboxField();
});

// filter
function filterPopup() {
    const filterBtn = document.getElementById('filterBtn');
    const filterField = document.getElementById('filterFeild');
    const selectAll = document.getElementById('selectAll');
    const deselectAll = document.getElementById('deselectAll');
    const closeFilter = document.getElementById('closeFilter');
    const updateFilter = document.getElementById('updateFilter');

    if (filterBtn) filterBtn.addEventListener('click', () => (filterField.style.display = 'block'));
    if (closeFilter) closeFilter.addEventListener('click', () => (filterField.style.display = 'none'));

    if (selectAll) {
        selectAll.addEventListener('click', () => {
            document.querySelectorAll('input[name="filters"]').forEach((cb) => (cb.checked = true));
        });
    }
    if (deselectAll) {
        deselectAll.addEventListener('click', () => {
            document.querySelectorAll('input[name="filters"]').forEach((cb) => (cb.checked = false));
        });
    }
}

// Add BookBox (modal) + camera + geolocation + AUTOCOMPLETE
function addBookboxField() {
    const addBoxBtnWrap = document.getElementById('addBox');
    const addBoxBtn = addBoxBtnWrap?.querySelector('button');
    const modal = document.getElementById('addBookbox');
    let backdrop = document.getElementById('modalBackdrop');

    const closeBtn = document.getElementById('srClose');
    const cancelBtn = document.getElementById('cancel');
    const submitBtn = document.getElementById('addBookboxSubmit');

    const nameInput = document.getElementById('boxName');
    const addressInput = document.getElementById('address');
    const useLocBtn = document.getElementById('useLocation');

    // attach autocomplete (NEW)
    if (addressInput) enableAddressAutocomplete(addressInput);

    // Camera controls
    const camPanel = document.getElementById('srCameraPanel');
    const openCamBtn = document.getElementById('srOpenCamera');
    const closeCamBtn = document.getElementById('srCloseCam');
    const flipBtn = document.getElementById('srFlip');
    const snapBtn = document.getElementById('srSnap');
    const mobileCapture = document.getElementById('srMobileCapture');
    const videoEl = document.getElementById('srVideo');
    const canvasEl = document.getElementById('srCanvas');

    // Files UI
    const fileInput = document.getElementById('picture');
    const preview = document.getElementById('srPreview');
    const chips = document.getElementById('srChips');

    let files = [];
    let stream = null;
    let usingFacingMode = 'environment';

    function show(el) {
        if (el) {
            el.hidden = false;
            el.style.display = '';
            el.classList.add('is-open');
        }
    }
    function hide(el) {
        if (el) {
            el.hidden = true;
            el.style.display = 'none';
            el.classList.remove('is-open');
        }
    }

    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'modalBackdrop';
        backdrop.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:1500; display:none;`;
        document.body.appendChild(backdrop);
    }

    function onEsc(e) {
        if (e.key === 'Escape') close();
    }
    function open(e) {
        if (e) e.preventDefault();
        if (!modal) return console.warn('#addBookbox not found');
        show(backdrop);
        show(modal);
        document.documentElement.style.overflow = 'hidden';
        setTimeout(() => nameInput?.focus(), 20);
        document.addEventListener('keydown', onEsc);
    }
    function close() {
        stopCamera(); // ensure we release camera on close
        hide(modal);
        hide(backdrop);
        document.documentElement.style.overflow = '';
        document.removeEventListener('keydown', onEsc);
    }

    addBoxBtnWrap?.addEventListener('click', open);
    addBoxBtn?.addEventListener('click', open);
    closeBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        close();
    });
    cancelBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        close();
    });
    backdrop?.addEventListener('click', (e) => {
        if (e.target === backdrop) close();
    });

    // --- Use my location ---
    useLocBtn?.addEventListener('click', () => {
        if (useLocBtn.tagName === 'BUTTON' && !useLocBtn.getAttribute('type')) {
            useLocBtn.setAttribute('type', 'button');
        }
        if (!requireSecure('Geolocation')) return;
        if (!('geolocation' in navigator)) {
            alert('Geolocation not supported in this browser.');
            return;
        }

        useLocBtn.disabled = true;
        const originalText = useLocBtn.textContent;
        useLocBtn.textContent = 'Getting location…';

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                addressInput.value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
                // user typed coords; no preselected suggestion
                addressInput._chosenCoords = { lat: coords.latitude, lng: coords.longitude };
                useLocBtn.disabled = false;
                useLocBtn.textContent = originalText;
            },
            (err) => {
                console.warn('Geolocation error:', err?.code, err?.message);
                alert(err?.code === 1 ? 'Permission denied. Enable location access in your browser/OS settings.' : 'Could not get your location.');
                useLocBtn.disabled = false;
                useLocBtn.textContent = originalText;
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
        );
    });

    // --- Camera logic (unchanged from last patch, with reliability fixes) ---
    [openCamBtn, closeCamBtn, flipBtn, snapBtn].forEach((btn) => {
        if (btn && btn.tagName === 'BUTTON' && !btn.getAttribute('type')) {
            btn.setAttribute('type', 'button');
        }
    });

    function supportsMediaDevices() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    async function openCamera() {
        if (!requireSecure('Camera')) return;
        if (!supportsMediaDevices()) {
            alert('Camera is not supported in this browser.');
            return;
        }
        try {
            const tryOpen = async (facing) => navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing } }, audio: false });
            if (stream) stream.getTracks().forEach((t) => t.stop());
            try {
                stream = await tryOpen(usingFacingMode || 'environment');
            } catch {
                stream = await tryOpen('user');
                usingFacingMode = 'user';
            }

            if (videoEl) {
                videoEl.setAttribute('playsinline', '');
                videoEl.muted = true;
                videoEl.srcObject = stream;
            }
            if (camPanel) camPanel.hidden = false;

            if (videoEl) {
                await new Promise((res) => {
                    if (videoEl.readyState >= 2) res();
                    else videoEl.onloadedmetadata = res;
                });
                await videoEl.play().catch(() => {});
            }
        } catch (err) {
            console.error('getUserMedia error:', err);
            const mapErr = {
                NotAllowedError: 'Camera permission was blocked. Please allow camera access in your browser/OS settings.',
                NotFoundError: 'No camera device found.',
                OverconstrainedError: 'Requested camera constraints not supported.',
            };
            alert(mapErr[err?.name] || 'Could not access the camera. Check browser/OS permissions.');
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach((t) => t.stop());
            stream = null;
        }
        if (camPanel) camPanel.hidden = true;
        if (videoEl) videoEl.srcObject = null;
    }

    async function flipCamera() {
        usingFacingMode = usingFacingMode === 'environment' ? 'user' : 'environment';
        await openCamera();
    }

    function capturePhoto() {
        if (!videoEl?.videoWidth) return;
        const w = videoEl.videoWidth,
            h = videoEl.videoHeight;
        canvasEl.width = w;
        canvasEl.height = h;
        const ctx = canvasEl.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, w, h);
        canvasEl.toBlob(
            (blob) => {
                if (!blob) return;
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                files.push(file);
                renderFiles();
            },
            'image/jpeg',
            0.92
        );
    }

    openCamBtn?.addEventListener('click', openCamera);
    closeCamBtn?.addEventListener('click', stopCamera);
    flipBtn?.addEventListener('click', flipCamera);
    snapBtn?.addEventListener('click', capturePhoto);

    // Files -> previews + chips
    fileInput?.addEventListener('change', (e) => {
        const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
        picked.forEach((f) => {
            const exists = files.some((x) => x.name === f.name && x.size === f.size);
            if (!exists) files.push(f);
        });
        renderFiles();
        fileInput.value = '';
    });

    mobileCapture?.addEventListener('change', (e) => {
        const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
        picked.forEach((f) => {
            const exists = files.some((x) => x.name === f.name && x.size === f.size);
            if (!exists) files.push(f);
        });
        renderFiles();
        mobileCapture.value = '';
    });

    function renderFiles() {
        if (preview) preview.innerHTML = '';
        files.slice(0, 8).forEach((file) => {
            const img = document.createElement('img');
            const r = new FileReader();
            r.onload = (ev) => (img.src = ev.target.result);
            r.readAsDataURL(file);
            preview?.appendChild(img);
        });

        if (chips) chips.innerHTML = '';
        files.forEach((f, idx) => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.innerHTML = `<span>${f.name}</span><button type="button" aria-label="Remove ${f.name}">×</button>`;
            chip.querySelector('button').addEventListener('click', () => {
                files.splice(idx, 1);
                renderFiles();
            });
            chips?.appendChild(chip);
        });
    }

    // Submit -> Firestore (prefer coords from autocomplete / "Use my location")
    submitBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const name = (nameInput?.value || '').trim();
        const addr = (addressInput?.value || '').trim();
        if (!name) return alert('Please enter a BookBox name.');
        if (!addr) return alert('Please enter an address.');

        try {
            const coords = addressInput._chosenCoords || null; // {lat,lng} if selected from suggestions or “Use my location”
            const newId = await createLibrary({ name, address: addr, coords });
            console.log('Created BookBox doc:', newId);
            nameInput.value = '';
            addressInput.value = '';
            addressInput._chosenCoords = null;
            stopCamera();
            hide(modal);
            hide(backdrop);
            document.documentElement.style.overflow = '';
            alert('Book Box saved!');
            // live listener draws the marker
        } catch (err) {
            console.error(err);
            alert(err?.message || 'Failed to save. Check console.');
        }
    });
}

//Search bookbox
const searchInput = document.getElementById('search-text') ;
const searchBtn = document.getElementById('searchBtn'); 

if (searchBtn) {
  searchBtn.addEventListener('click', searchBookboxByAddress);
}

async function searchBookboxByAddress() {
  const q = (searchInput?.value || '').trim().toLowerCase();
  if (!q) {
    alert('Please enter a street address to search.');
    return;
  }

  try {
    // use the collection store BookBoxes in:
    const col = collection(db, 'streetLibraries');
    const snapshot = await getDocs(col);

    const results = snapshot.docs.filter(doc => {
      const addr = doc.data()?.address;
      return typeof addr === 'string' && addr.toLowerCase().includes(q);
    });

    if (results.length === 0) {
      alert('No book boxes found. You can add new bookbox!');
      return;
    }

    // Move map to the first match (or iterate)
    results.forEach(doc => {
      const data = doc.data();
      // normalize location field
      const loc = data.location;
      if (loc && (typeof loc.latitude === 'number' || typeof loc.lat === 'number')) {
        // GeoPoint (latitude/longitude) or {lat,lng}
        const lat = loc.latitude ?? loc.lat;
        const lng = loc.longitude ?? loc.lng;
        if (typeof lat === 'number' && typeof lng === 'number') {
          // use your map instance variable (appMap) to center
          if (appMap && typeof appMap.easeTo === 'function') {
            appMap.easeTo({ center: [lng, lat], zoom: 15, duration: 600 });
          } else if (map && typeof map.setCenter === 'function') {
            map.setCenter([lng, lat]);
            map.setZoom(15);
          }
        }
      } else if (data.address) {
        // fallback: forward geocode then move (optional)
        // const pos = await geocodeAddress(data.address);
        // appMap.easeTo({ center: [pos.lng, pos.lat], zoom: 15 });
      }
    });
  } catch (err) {
    console.error('Search error', err);
    alert('Search failed');
  }
    // clear the search input and optionally focus it again
    try {
        if (searchInput && 'value' in searchInput) {
            searchInput.value = '';
            if (typeof searchInput.focus === 'function') searchInput.focus();
        }
    } catch (e) {
        
    }

}


//// Filter ////
// Recently updated//

/*
 Show only BookBoxes created or updated within the last `days` days.
 */
async function showRecentlyUpdated(map = appMap, days = 1) {
    if (!map) {
        console.warn('showRecentlyUpdated: map not available');
        return;
    }

    try {
        const colRef = collection(db, 'streetLibraries');
        const snap = await getDocs(colRef);

        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

        const keepIds = new Set();

        snap.docs.forEach((doc) => {
            const data = doc.data() || {};
            const ts = data.updatedAt ?? data.createdAt;
            let ms = null;
            if (ts) {
                if (typeof ts.toDate === 'function') ms = ts.toDate().getTime();
                else if (typeof ts.seconds === 'number') ms = ts.seconds * 1000;
                else if (typeof ts === 'number') ms = ts;
            }
            if (ms && ms >= cutoff) keepIds.add(doc.id);
        });

        // Remove markers that are not in keepIds
        for (const id of Array.from(markersById.keys())) {
            if (!keepIds.has(id)) removeMarkerById(id);
        }

        // Add/update markers for docs we want to keep
        for (const doc of snap.docs) {
            if (keepIds.has(doc.id)) addOrUpdateMarkerFromDoc(map, doc);
        }

        if (keepIds.size === 0) {
            alert('No recently updated BookBoxes found in the last ' + days + ' days.');
        }
    } catch (err) {
        console.error('showRecentlyUpdated error', err);
        alert('Failed to fetch recently updated BookBoxes. See console.');
    }
}

// Wire the Update filter button (if present) to run the recent filter
(function _wireRecentFilterButton() {
    const btn = document.getElementById('updateFilter');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        // if the checkbox exists, respect it; otherwise default to running
        const recentCb = document.getElementById('recently-updated');
        const nearbyCb = document.getElementById('nearby');
        // Nearby takes precedence if checked
        if (nearbyCb && nearbyCb.checked) {
            nearbyMe(appMap, 1000);
            // close filter UI
            const ff = document.getElementById('filterFeild');
            if (ff) ff.style.display = 'none';
            return;
        }
        if (recentCb && recentCb.checked) {
            showRecentlyUpdated(appMap, 1);
            const ff = document.getElementById('filterFeild');
            if (ff) ff.style.display = 'none';
            return;
        }
        // if unchecked, re-run full live listener render by reloading markers
        (async () => {
            try {
                const colRef = collection(db, 'streetLibraries');
                const snap = await getDocs(colRef);
                // add/update all
                snap.docs.forEach((d) => addOrUpdateMarkerFromDoc(appMap, d));
            } catch (err) {
                console.error('Failed to refresh markers after clearing recent filter', err);
            }
        })();
        // close filter UI if present
        const filterField = document.getElementById('filterFeild');
        if (filterField) filterField.style.display = 'none';
    });
})();

//Nearby
async function nearbyMe(map = appMap, meters = 1000) {
    if (!map) {
        console.warn('nearbyMe: map not available');
        return;
    }

    if (!requireSecure('Geolocation')) {
        alert('Nearby filter requires HTTPS or http://localhost');
        return;
    }
    if (!('geolocation' in navigator)) {
        alert('Geolocation not supported in this browser.');
        return;
    }

    // get current position as a promise
    const getPos = () =>
        new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (p) => resolve(p.coords),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
            );
        });

    let coords;
    try {
        coords = await getPos();
    } catch (err) {
        console.error('nearbyMe: could not get position', err);
        alert('Could not get your location. Make sure location is enabled and the page is served over HTTPS.');
        return;
    }

    const userLat = coords.latitude;
    const userLng = coords.longitude;

    function distanceMeters(lat1, lng1, lat2, lng2) {
        const R = 6371000; // meters
        const toRad = (d) => (d * Math.PI) / 180;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lng2 - lng1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    try {
        const colRef = collection(db, 'streetLibraries');
        const snap = await getDocs(colRef);

        const keepIds = new Set();

        snap.docs.forEach((doc) => {
            const data = doc.data() || {};
            const ll = normalizeLocationToLngLat(data.location);
            if (!ll) return;
            const [lng, lat] = ll;
            const d = distanceMeters(userLat, userLng, lat, lng);
            if (d <= meters) keepIds.add(doc.id);
        });

        // Remove markers that are not nearby
        for (const id of Array.from(markersById.keys())) {
            if (!keepIds.has(id)) removeMarkerById(id);
        }

        // Add/update markers for nearby docs
        for (const doc of snap.docs) {
            if (keepIds.has(doc.id)) addOrUpdateMarkerFromDoc(map, doc);
        }

        if (keepIds.size === 0) alert('No BookBoxes found within ' + (meters / 1000).toFixed(1) + ' km.');
    } catch (err) {
        console.error('nearbyMe error', err);
        alert('Failed to fetch nearby BookBoxes. See console.');
    }
}
