//Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDP88zVX_yPRwOKZl_xJxqjph2GFBNuk2o",
  authDomain: "street-reads.firebaseapp.com",
  projectId: "street-reads",
  storageBucket: "street-reads.firebasestorage.app",
  messagingSenderId: "228045832951",
  appId: "1:228045832951:web:4b6d868e05a72ab08a89f2"
};

// Firebase を初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


const apiKey = "CL5Ni3mQjMRBsIchbKD6ousDrxTwSSQI";
const firstName = document.getElementById("name")
let map;
let markers = []; // Store all markers for management
let latestPinLocation = null; // Store the latest pin location for Add BookBox


document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing map...');
    
    
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }
    console.log('Map container found');
    
    
    if (typeof tt === 'undefined') {
        console.error('TomTom SDK not loaded!');
        return;
    }
    console.log('TomTom SDK loaded');
    
    try {
        map = tt.map({
            key: apiKey,
            container: 'map',
            center: [-123.10904462328836, 49.22895825651896],  // 経度, 緯度の順序（TomTom形式）
            zoom: 12
        });

        map.addControl(new tt.NavigationControl());
        map.addControl(new tt.FullscreenControl());
        
                
        // Add click event listener for location pinning
        map.on('click', function(e) {
            console.log('Map clicked at:', e.lngLat);
            const coordinates = e.lngLat;
            addLocationPin(map, coordinates);
        });
        
        // Get user's current location
        getCurrentLocation();
        // load saved BookBoxes as markers on the main map
        loadBookBoxes();

        console.log('Map initialized successfully!');
    } catch (error) {
        console.error('Error creating map:', error);
    }

    filterPopup();
    addBookboxField();
});

// Get user's current location
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude
                };
                console.log('User location:', userLocation);
                
                // Center map on user location
                map.setCenter([userLocation.lng, userLocation.lat]);
                map.setZoom(15);
                
                // Add a special marker for user location
                addUserLocationMarker(userLocation);
            },
            function(error) {
                console.error('Error getting location:', error);
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
}


// filter 
function filterPopup() {
    const filterBtn = document.getElementById('filterBtn');
    const filterField = document.getElementById('filterFeild');
    const selectAll = document.getElementById('selectAll');
    const deselectAll = document.getElementById('deselectAll');
    const closeFilter = document.getElementById('closeFilter'); 
    const updateFilter = document.getElementById('updateFilter');

    // open filter
    if(filterBtn) {
        filterBtn.addEventListener('click', function(){
            filterField.style.display = 'block';
        });
    };

    // close filter
    if(closeFilter) {
        closeFilter.addEventListener('click',function(){
            filterField.style.display ='none';
        });
    };

    //select all
    if(selectAll) {
        selectAll.addEventListener("click", function(){
            const checkboxes = document.querySelectorAll('input[name="filters"]'); 
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = true; // checkboxに修正、trueを追加
            });
        });
    };

    //deselect all  
    if(deselectAll) {
        deselectAll.addEventListener("click", function(){
            const checkboxes = document.querySelectorAll('input[name="filters"]');
            
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        });
    };
};

//Add BookBox
function addBookboxField(){
    const addBox = document.getElementById('addBox');
    const addBookbox = document.getElementById('addBookbox');
    const cancel = document.getElementById('cancel');
    const addBookboxSubmit = document.getElementById('addBookboxSubmit');

    // open add bookbox field
    if(addBox) {
        addBox.addEventListener('click', function(){
            addBookbox.style.display = 'block';

            // attach auto-location listener when form is opened
            const addressInput = document.getElementById('boxAddress');
            if (addressInput && !addressInput.dataset.autolisten) {
                addressInput.dataset.autolisten = 'true';

                // on focus or click, try to get current geolocation and reverse-geocode
                const autofill = async function() {
                    if (!navigator.geolocation) {
                        console.log('Geolocation not supported');
                        return;
                    }

                    addressInput.disabled = true; // prevent user typing while resolving
                    addressInput.placeholder = 'Finding your location...';

                    navigator.geolocation.getCurrentPosition(async (position) => {
                        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                        latestPinLocation = coords; // save for later

                        // center map near the location
                        try {
                            if (map) {
                                map.setCenter([coords.lng, coords.lat]);
                                map.setZoom(15);
                            }
                        } catch (error) {
                            console.warn('Can not find your location', error);
                        }

                        // reverse geocode to a human readable address
                        const readableAddress = await reverseGeocode(coords.lat, coords.lng);
                        if (readableAddress) {
                            addressInput.value = readableAddress;
                        }

                        addressInput.disabled = false;
                        addressInput.placeholder = '';

                    }, (error) => {
                        console.error('Geolocation error:', error);
                        addressInput.disabled = false;
                        addressInput.placeholder = '';
                    }, { enableHighAccuracy: true, timeout: 10000 });
                };

                addressInput.addEventListener('focus', autofill);
                addressInput.addEventListener('click', autofill);
            }
        });
    };

    // cancel = close add bookbox field 
    if(cancel) {
        cancel.addEventListener('click', function(){
            addBookbox.style.display = 'none';
            clearFrom();
        });
    };

    // submit add bookbox to database
    if(addBookboxSubmit) {
        addBookboxSubmit.addEventListener('click', function(e){
            e.preventDefault(); 
            submitBookBoxToDatabase();
        });
    };

}


// reverse geocode helper (TomTom)
async function reverseGeocode(lat, lng) {
    try {
        const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat}%2C${lng}.json?key=${apiKey}&limit=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data && data.addresses && data.addresses.length > 0) {
            // TomTom returns address info in data.addresses[0].address
            const addr = data.addresses[0].address;
            // build human readable address
            const parts = [];
            if (addr.municipality) parts.push(addr.municipality);
            if (addr.streetName) parts.push(addr.streetName + (addr.streetNumber ? ` ${addr.streetNumber}` : ''));
            if (addr.countrySubdivision) parts.push(addr.countrySubdivision);
            if (addr.country) parts.push(addr.country);
            const human = parts.join(', ');
            return human || (addr.freeformAddress || null);
        }
        return null;
    } catch (err) {
        console.error('reverseGeocode error', err);
        return null;
    }
}

//Add bookbox data into database
async function submitBookBoxToDatabase() {
    try {
        const nameInput = document.getElementById('boxName');
        const addressInput = document.getElementById('boxAddress');
        const boxImg = document.getElementById('boxImg');

        if (!nameInput || !addressInput || !boxImg) {
            alert('Please fill in all fields.');
            return;
        }

        // img
        let photoUrl = null;
        if (boxImg.files && boxImg.files[0]) {
            // Upload Img to Firebase Storage
            photoUrl = await uploadImageToStorage(boxImg.files[0]);
        }

        const bookBoxData = {
            name: nameInput.value.trim(),
            address: addressInput.value.trim(),
            photoUrl: photoUrl, 
            //Take photo or add img?
            averageRating:0,
            createdAt: new Date(),
        };


        // save to database
        const docRef = await addDoc(collection(db, 'streetLibraries'), bookBoxData);
        console.log(bookBoxData);

        // refresh markers on the map to include the new BookBox
        await loadBookBoxes();

        // success message
        alert('success');

        // close the form 
        document.getElementById('addBookbox').style.display = 'none';
        clearForm();


    } catch (error) {
        console.error('Error adding BookBox: ', error);
        alert('Error adding BookBox: ' + error.message);
    }
}

// Forward geocode: address -> { lat, lon }
async function geocodeAddress(address) {
    try {
        const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(address)}.json?key=${apiKey}&limit=1`;
        const response = await fetch(url);
        if (!response.ok) return null;
        const data = await response.json();
        if (data && data.results && data.results.length > 0) {
            return data.results[0].position; // { lat, lon }
        }
        return null;
    } catch (error) {
        console.error('geocodeAddress error', error);
        return null;
    }
}

// Load saved bookBoxes from Firestore and add markers to the main `map`.
async function loadBookBoxes() {
    try {
        // remove existing markers first to avoid duplicates
        clearMarkers();
        const snapshot = await getDocs(collection(db, 'streetLibraries'));
        snapshot.forEach(async (doc) => {
            const data = doc.data();

            // Try several fields for coordinates, or geocode from address as a fallback
            let lat = null, lng = null;
            if (data.location && typeof data.location.lat === 'number' && typeof data.location.lng === 'number') {
                lat = data.location.lat; lng = data.location.lng;
            } else if (data.location && typeof data.location.latitude === 'number' && typeof data.location.longitude === 'number') {
                lat = data.location.latitude; lng = data.location.longitude;
            } else if (data.address) {
                const pos = await geocodeAddress(data.address);
                if (pos) { lat = pos.lat; lng = pos.lon; }
            }
            if (lat !== null && lng !== null) {
                addMarkerForBookbox(doc.id, data, lat, lng);
            } else {
                console.warn('No coords for bookbox', doc.id);
            }
        });
    } catch (err) {
        console.error('loadBookBoxes error', err);
    }
}

function addMarkerForBookbox(id, data, lat, lng) {
    if (!map) return;

    // create a custom DOM marker so CSS (.bookbox-marker) styles apply
    const element = document.createElement('div');
    element.className = 'bookbox-marker';
    // insert image from src folder as the pin graphic (path relative to pages/homepage.html)
    const img = document.createElement('img');
    img.src = '../src/location_pin.png';
    img.alt = 'pin';
    img.style.width = '28px';
    img.style.height = '28px';
    img.style.display = 'block';
    img.style.pointerEvents = 'none'; // allow clicks to reach marker element
    element.appendChild(img);

    const marker = new tt.Marker({ element: element, anchor: 'bottom' })
        .setLngLat([lng, lat])
        .addTo(map);

    // keep track so we can remove later
    markers.push(marker);

    // build popup content safely
    const parts = [`<strong>${escapeHtml(data.name || 'No name')}</strong>`];
    if (data.photoUrl) parts.push(`<img src="${escapeHtml(data.photoUrl)}" style="max-width:200px;display:block;margin-top:6px;" />`);
    if (data.address) parts.push(`<div style="margin-top:4px">${escapeHtml(data.address)}</div>`);

    const popup = new tt.Popup({ offset: 25 }).setHTML(parts.join(''));
    // set popup coordinates so it can be shown programmatically
    popup.setLngLat([lng, lat]);
    marker.setPopup(popup);

    // center map and open popup when marker element is clicked
    element.addEventListener('click', () => {
        try {
            // open the popup at this marker
            popup.addTo(map);
            // center and zoom the map
            map.setCenter([lng, lat]);
            map.setZoom(15);
        } catch (error) {
            console.warn('Could not open popup or center map on click', error);
        }
    });
}

function clearMarkers() {
    if (!markers || markers.length === 0) return;
    markers.forEach(m => {
        try { m.remove(); } catch (error) { /* ignore */ }
    });
    markers = [];
}

// for security
function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, function(c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
}