const apiKey = "CL5Ni3mQjMRBsIchbKD6ousDrxTwSSQI";

// DOMが読み込まれてからマップを初期化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing map...');
    
    // マップコンテナの存在確認
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }
    console.log('Map container found');
    
    // TomTom SDK確認
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
});
