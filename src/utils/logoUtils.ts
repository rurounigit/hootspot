// src/services/logoUtils.ts

/**
 * Converts a logo file to a Base64 PNG string using canvas
 * This ensures compatibility with @react-pdf/renderer
 */
export const getLogoBase64 = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const logoPath = '/images/icons/icon.png'; // Path to your logo

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Create temporary canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0);

      // Convert to PNG Base64
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(new Error('Failed to convert image to Base64'));
      }

      // Clean up
      canvas.remove();
    };

    img.onerror = () => {
      reject(new Error('Failed to load logo image'));
    };

    img.src = logoPath;
  });
};
