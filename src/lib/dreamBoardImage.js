const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const TARGET_DATA_URL_CHARS = 520_000;
const MAX_EDGE_PX = 1200;

/**
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image.'));
    };
    img.src = objectUrl;
  });
}

/**
 * Resize and compress so dream board photos fit mobile localStorage quotas.
 * @param {HTMLImageElement} img
 */
function compressLoadedImage(img) {
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image.');
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.86;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > TARGET_DATA_URL_CHARS && quality > 0.52) {
    quality -= 0.07;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}

/**
 * @param {File} file
 * @returns {Promise<string>} data URL suitable for local draft storage
 */
export async function readDreamBoardImageFile(file) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP).');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image must be under 2 MB.');
  }
  const img = await loadImageFromFile(file);
  return compressLoadedImage(img);
}
