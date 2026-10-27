// Cloudinary Configuration & Upload Utility

export const CLOUDINARY_CONFIG = {
  cloudName: "plpznnxh",
  uploadPreset: "webworldbd",
  folder: "webworldbd_uploads"
};

/**
 * Transforms a Cloudinary secure URL with face crop, quality, and format auto-optimizations.
 * @param {string} url - Original image URL
 * @param {number} width - Target width (default 256)
 * @param {number} height - Target height (default 256)
 * @returns {string} Transformed URL
 */
export function getOptimizedImageUrl(url, width = 256, height = 256) {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }
  const transformation = `upload/c_fill,g_face,w_${width},h_${height},f_auto,q_auto/`;
  return url.replace('/upload/', `/${transformation}`);
}

/**
 * Uploads an image blob or file directly to Cloudinary using Unsigned upload preset.
 * @param {Blob|File} file - Image file or blob to upload
 * @param {Object} options - Upload options including onProgress callback and signal/xhr controller
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export function uploadToCloudinary(file, options = {}) {
  return new Promise((resolve, reject) => {
    // 1. File Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
      return reject(new Error('INVALID_FORMAT'));
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
    if (file.size && file.size > MAX_SIZE_BYTES) {
      return reject(new Error('FILE_TOO_LARGE'));
    }

    // 2. Prepare Form Data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', CLOUDINARY_CONFIG.folder);
    formData.append('tags', 'profile');

    // 3. XMLHttpRequest for real progress tracking
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

    xhr.open('POST', endpoint, true);

    if (options.onProgress && typeof options.onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          options.onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve({
              secure_url: response.secure_url,
              public_id: response.public_id
            });
          } else {
            reject(new Error('UPLOAD_FAILED'));
          }
        } catch (e) {
          reject(new Error('INVALID_RESPONSE'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error?.message || 'UPLOAD_FAILED'));
        } catch (e) {
          reject(new Error(`UPLOAD_FAILED_${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('NETWORK_ERROR'));
    };

    xhr.onabort = () => {
      reject(new Error('UPLOAD_ABORTED'));
    };

    if (options.registerCancel && typeof options.registerCancel === 'function') {
      options.registerCancel(() => xhr.abort());
    }

    xhr.send(formData);
  });
}
