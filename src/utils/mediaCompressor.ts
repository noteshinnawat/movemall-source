// src/utils/mediaCompressor.ts — Client-side Image & Video Compression Utility

export interface CompressionResult {
  file: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savedPercentage: number;
}

/**
 * บีบอัดรูปภาพเป็น WebP ความละเอียดเหมาะสม (ลดขนาดไฟล์ 70-90% ก่อนส่งไปหลังบ้าน)
 */
export async function compressImage(
  file: File | Blob,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.8
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // คำนวณ Aspect Ratio ให้พอดีกับ maxWidth / maxHeight
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
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP format with target quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image compression failed'));
              return;
            }

            const compressedDataUrl = canvas.toDataURL('image/webp', quality);
            const originalSize = file.size;
            const compressedSize = blob.size;
            const savedPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: blob,
              dataUrl: compressedDataUrl,
              originalSize,
              compressedSize,
              savedPercentage,
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
