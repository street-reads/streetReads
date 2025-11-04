// Cloudinary Image Upload Utility
// Usage: Upload images for profiles and book boxes using Cloudinary

/**
 * Upload a single image file to Cloudinary
 * @param {File} file - The image file to upload
 * @param {string} folder - Cloudinary folder path (e.g., 'profiles' or 'bookboxes')
 * @param {string} publicId - Optional custom public ID, defaults to timestamp
 * @returns {Promise<string>} Secure URL of uploaded image
 */
async function uploadImage(file, folder = 'bookbox', publicId = null) {
    try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            throw new Error('File must be an image');
        }
        
        // Validate file size (max 10MB for Cloudinary free tier)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('Image size must be less than 10MB');
        }
        
        // Check if config is available
        if (!window.cloudinaryConfig || !window.cloudinaryConfig.cloudName) {
            throw new Error('Cloudinary is not configured. Please check cloudinary-config.js');
        }
        
        const { cloudName, uploadPreset, apiUrl } = window.cloudinaryConfig;
        const uploadUrl = `${apiUrl}/${cloudName}/image/upload`;
        
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', folder);
        
        // Add public ID if provided
        if (publicId) {
            formData.append('public_id', publicId);
        }
        
        // Note: Transformations are better applied via URL or upload preset settings
        // Example URL transformation: https://res.cloudinary.com/cloud/image/upload/w_1200,h_1200,c_limit,q_auto/{public_id}
        
        // Upload to Cloudinary
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Upload failed');
        }
        
        const data = await response.json();
        const secureUrl = data.secure_url || data.url;
        
        console.log('Image uploaded successfully:', secureUrl);
        return secureUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image: ' + error.message);
    }
}

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<string[]>} Array of secure URLs
 */
async function uploadMultipleImages(files, folder = 'bookbox') {
    try {
        // Validate all files are images
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                throw new Error('All files must be images');
            }
            
            // Max 10MB per image
            const maxSize = 10 * 1024 * 1024;
            if (file.size > maxSize) {
                throw new Error(`Image ${file.name} is too large (max 10MB)`);
            }
        });
        
        // Upload all files in parallel
        const uploadPromises = files.map((file, index) => {
            const timestamp = Date.now();
            const publicId = `${folder}_${timestamp}_${index}`;
            return uploadImage(file, folder, publicId);
        });
        
        const downloadURLs = await Promise.all(uploadPromises);
        return downloadURLs;
    } catch (error) {
        console.error('Error uploading multiple images:', error);
        throw error;
    }
}

/**
 * Upload profile picture
 * @param {File} file - Profile picture file
 * @param {string} userId - User ID
 * @returns {Promise<string>} Secure URL
 */
async function uploadProfilePicture(file, userId) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        throw new Error('Image size must be less than 10MB');
    }
    
    const publicId = `profiles/profile_${userId}`;
    return await uploadImage(file, 'profiles', publicId);
}

/**
 * Upload book box images
 * @param {File[]} files - Array of book box images
 * @param {string} boxId - Book box ID
 * @returns {Promise<string[]>} Array of secure URLs
 */
async function uploadBookBoxImages(files, boxId) {
    // Validate all files are images
    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            throw new Error('All files must be images');
        }
        
        // Max 10MB per image
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`Image ${file.name} is too large (max 10MB)`);
        }
    });
    
    const folder = `bookboxes/${boxId}`;
    return await uploadMultipleImages(files, folder);
}

/**
 * Delete an image from Cloudinary
 * @param {string} imageURL - Full URL of the image (or public ID)
 * @returns {Promise<void>}
 */
async function deleteImage(imageURL) {
    try {
        // Extract public ID from URL
        // Cloudinary URLs format: https://res.cloudinary.com/{cloud}/image/upload/v{version}/{public_id}.{format}
        const urlParts = imageURL.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex === -1) {
            throw new Error('Invalid Cloudinary URL');
        }
        
        // Get public ID (everything after 'upload/v{version}/' or just 'upload/')
        let publicId = urlParts.slice(uploadIndex + 1).join('/');
        
        // Remove version if present (format: v1234567890)
        publicId = publicId.replace(/^v\d+\//, '');
        
        // Remove file extension
        publicId = publicId.replace(/\.[^.]+$/, '');
        
        // For deletion, you'd typically need a server-side endpoint
        // since deletion requires authentication
        console.warn('Image deletion from Cloudinary requires server-side API. Public ID:', publicId);
        console.log('To delete this image, implement a server-side endpoint using Cloudinary Admin API');
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
}

/**
 * Compress image before upload (optional, reduces storage usage)
 * @param {File} file - Image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} quality - Quality (0.1 to 1.0)
 * @returns {Promise<File>} Compressed image as File
 */
function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => {
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    },
                    file.type,
                    quality
                );
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// Export functions for global use
window.uploadImage = uploadImage;
window.uploadMultipleImages = uploadMultipleImages;
window.uploadProfilePicture = uploadProfilePicture;
window.uploadBookBoxImages = uploadBookBoxImages;
window.deleteImage = deleteImage;
window.compressImage = compressImage;

