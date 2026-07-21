/**
 * Image Compression Utility for AI Food Scanning
 *
 * Resizes + re-encodes photos as JPEG before they're sent to the Gemini proxy.
 * Vercel Serverless Functions reject request bodies over ~4.5MB, and raw
 * camera photos (5-12MB) blow past that once base64-encoded — this keeps the
 * upload small regardless of the original file size/format.
 */

// 1024px alcanza de sobra para estimar macros y reduce mucho la latencia:
// menos bytes que subir desde el celular y menos tokens de imagen que
// procesar en Gemini (los timeouts de visión a >30s venían de fotos 1600px).
const MAX_UPLOAD_DIMENSION = 1024;
const UPLOAD_JPEG_QUALITY = 0.8;
const IMAGE_LOAD_TIMEOUT_MS = 8000; // guards against onload/onerror never firing

/**
 * Resize (max 1600px on the longest side) and re-encode a file as a JPEG data URL.
 * @param file - Image file to compress
 * @returns Promise<string> - JPEG data URL ("data:image/jpeg;base64,...")
 */
export async function compressImageForUpload(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        let settled = false;

        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            URL.revokeObjectURL(url);
            console.error('[ImageCompression] Timed out compressing image for upload');
            reject(new Error('Tiempo de espera agotado al procesar la imagen'));
        }, IMAGE_LOAD_TIMEOUT_MS);

        img.onload = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);

            let { width, height } = img;
            if (width > height && width > MAX_UPLOAD_DIMENSION) {
                height = Math.round((height * MAX_UPLOAD_DIMENSION) / width);
                width = MAX_UPLOAD_DIMENSION;
            } else if (height > MAX_UPLOAD_DIMENSION) {
                width = Math.round((width * MAX_UPLOAD_DIMENSION) / height);
                height = MAX_UPLOAD_DIMENSION;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL('image/jpeg', UPLOAD_JPEG_QUALITY));
        };

        img.onerror = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
