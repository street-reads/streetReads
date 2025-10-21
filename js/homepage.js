const apiKey = "CL5Ni3mQjMRBsIchbKD6ousDrxTwSSQI";
const firstName = document.getElementById("name")


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
        const map = tt.map({
            key: apiKey,
            container: 'map',
            center: [-123.10904462328836, 49.22895825651896],  // 経度, 緯度の順序（TomTom形式）
            zoom: 12
        });

        map.addControl(new tt.NavigationControl());
        map.addControl(new tt.FullscreenControl());
        
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

// Add BookBox (modal) — with native camera capture
function addBookboxField(){
  const addBoxBtnWrap = document.getElementById('addBox');        // existing wrapper (click to open)
  const modal         = document.getElementById('addBookbox');     // modal container
  const backdrop      = document.getElementById('modalBackdrop');  // backdrop
  const closeBtn      = document.getElementById('srClose');
  const cancelBtn     = document.getElementById('cancel');
  const submitBtn     = document.getElementById('addBookboxSubmit');

  const nameInput     = document.getElementById('boxName');
  const addressInput  = document.getElementById('address');
  const useLocBtn     = document.getElementById('useLocation');

  const fileInput     = document.getElementById('picture');        // multi gallery
  const camInput      = document.getElementById('cameraCapture');  // native camera
  const preview       = document.getElementById('srPreview');
  const chips         = document.getElementById('srChips');

  let files = [];

  function onEsc(e){ if(e.key === 'Escape') close(); }
  function open(){
    backdrop.hidden = false; modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => nameInput?.focus(), 20);
    document.addEventListener('keydown', onEsc);
  }
  function close(){
    backdrop.hidden = true; modal.hidden = true;
    document.documentElement.style.overflow = '';
    document.removeEventListener('keydown', onEsc);
  }

  // open/close triggers
  addBoxBtnWrap?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);
  backdrop?.addEventListener('click', (e)=>{ if(e.target===backdrop) close(); });

  // Use my location (fills "lat, lng")
  useLocBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }
    useLocBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      ({coords}) => {
        addressInput.value = `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
        useLocBtn.disabled = false;
      },
      () => { alert('Could not get your location.'); useLocBtn.disabled = false; },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  // File picker (multi)
  fileInput?.addEventListener('change', (e) => {
    const picked = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    mergeFiles(picked);
    fileInput.value = ''; // allow re-selecting same files
  });

  // Device camera capture (single per shot)
  camInput?.addEventListener('change', (e) => {
    const shot = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
    mergeFiles(shot);
    camInput.value = ''; // allow another capture immediately
  });

  function mergeFiles(newOnes){
    newOnes.forEach(f => {
      const exists = files.some(x => x.name === f.name && x.size === f.size);
      if (!exists) files.push(f);
    });
    render();
  }

  function render(){
    // thumbs
    preview.innerHTML = '';
    files.slice(0,8).forEach(file => {
      const img = document.createElement('img');
      const r = new FileReader();
      r.onload = ev => img.src = ev.target.result;
      r.readAsDataURL(file);
      preview.appendChild(img);
    });

    // chips
    chips.innerHTML = '';
    files.forEach((f, idx) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = `<span>${f.name}</span><button type="button" aria-label="Remove ${f.name}">×</button>`;
      chip.querySelector('button').addEventListener('click', () => {
        files.splice(idx,1);
        render();
      });
      chips.appendChild(chip);
    });
  }

  // Submit demo (hook to backend later)
  submitBtn?.addEventListener('click', () => {
    const name = (nameInput?.value || '').trim();
    const addr = (addressInput?.value || '').trim();
    if(!name){ alert('Please enter a BookBox name.'); return; }
    if(!addr){ alert('Please enter an address or use your location.'); return; }

    console.log('Submitting Book Box:', {
      name, address: addr,
      images: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    close();
    setTimeout(() => alert('Book Box added (demo). Check console.'), 120);
  });
}
