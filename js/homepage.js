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
        });
    };

    // cancel = close add bookbox field 
    if(cancel) {
        cancel.addEventListener('click', function(){
            addBookbox.style.display = 'none';
        });
    };

}
