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
 * Compresses an image client-side if its dimensions exceed maxWidth or maxHeight.
 * @param {File} file - Original image file
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @param {number} quality - Image quality (0.1 to 1.0)
 * @returns {Promise<File|Blob>}
 */
export function compressImageIfNeeded(file, maxWidth = 2000, maxHeight = 2000, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;

      if (width <= maxWidth && height <= maxHeight) {
        return resolve(file);
      }

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        const compressedFile = new File([blob], file.name, {
          type: file.type || 'image/jpeg',
          lastModified: Date.now()
        });
        resolve(compressedFile);
      }, file.type || 'image/jpeg', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Uploads an image or document file directly to Cloudinary using Unsigned upload preset.
 * Supports up to 30MB files and auto upload endpoint.
 * @param {Blob|File} file - File or blob to upload
 * @param {Object} options - Upload options including onProgress callback and registerCancel function
 * @returns {Promise<{secure_url: string, public_id: string}>}
 */
export function uploadToCloudinary(file, options = {}) {
  return new Promise((resolve, reject) => {
    // 1. File Format Validation (Block Executables)
    const blockedExts = ['.exe', '.apk', '.bat', '.js', '.sh', '.msi'];
    const fileName = file.name || '';
    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (blockedExts.includes(ext)) {
      return reject(new Error('EXECUTABLE_BLOCKED'));
    }

    const MAX_SIZE_BYTES = 30 * 1024 * 1024; // 30MB
    if (file.size && file.size > MAX_SIZE_BYTES) {
      return reject(new Error('FILE_TOO_LARGE'));
    }

    // 2. Prepare Form Data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', options.uploadPreset || CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', options.folder || CLOUDINARY_CONFIG.folder);

    // 3. XMLHttpRequest for real progress tracking
    const xhr = new XMLHttpRequest();
    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/auto/upload`;

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
