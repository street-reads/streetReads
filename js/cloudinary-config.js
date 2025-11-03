// Cloudinary Configuration
// Your Cloudinary credentials from: https://cloudinary.com/console

const cloudinaryConfig = {
    // Your Cloud Name (required)
    cloudName: 'dlsdg0urv',
 
    uploadPreset: 'images',
    
    apiUrl: 'https://api.cloudinary.com/v1_1',
    
    apiKey: '335894821763226',
};

// Note: For unsigned uploads (current setup), we only need cloudName and uploadPreset
// API key and secret are optional and should only be used on the server-side for security

// Export for use in other files
window.cloudinaryConfig = cloudinaryConfig;

