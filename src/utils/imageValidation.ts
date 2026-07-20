/**
 * Image Validation Utility for AI Food Scanning
 *
 * Validates image quality before sending to AI model:
 * - File size check (< 10MB)
 * - Resolution check (min 200x200px)
 * - Brightness estimation (warn if < 30%)
 */

export interface ImageQualityResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metadata?: {
        width: number;
        height: number;
        fileSize: number;
        brightness?: number;
    };
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_WIDTH = 200;
const MIN_HEIGHT = 200;
const MIN_BRIGHTNESS = 30; // 0-100 scale
const IMAGE_LOAD_TIMEOUT_MS = 8000; // guards against onload/onerror never firing (e.g. some HEIC/Android WebView cases)

/**
 * Validate image file before AI scan
 * @param file - Image file to validate
 * @returns Promise<ImageQualityResult> with validation results
 */
export async function validateImageQuality(file: File): Promise<ImageQualityResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = new Date().toISOString();

    console.log(`[ImageValidation ${timestamp}] Starting validation for: ${file.name}`);

    // 1. Check file size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: 10MB`);
        console.error(`[ImageValidation ${timestamp}] ✗ File too large: ${file.size} bytes`);
    }

    // 2. Check if it's actually an image
    if (!file.type.startsWith('image/')) {
        errors.push('El archivo no es una imagen válida');
        console.error(`[ImageValidation ${timestamp}] ✗ Invalid file type: ${file.type}`);
    }

    // If critical errors, return early
    if (errors.length > 0) {
        return {
            isValid: false,
            errors,
            warnings,
            metadata: {
                width: 0,
                height: 0,
                fileSize: file.size,
            },
        };
    }

    // 3. Load image and check resolution + brightness
    try {
        const imageData = await loadImageData(file);
        const { width, height, canvas } = imageData;

        console.log(`[ImageValidation ${timestamp}] Image loaded: ${width}x${height}px`);

        // Check resolution
        if (width < MIN_WIDTH || height < MIN_HEIGHT) {
            errors.push(`Resolución muy baja (${width}x${height}px). Mínimo: ${MIN_WIDTH}x${MIN_HEIGHT}px`);
            console.warn(`[ImageValidation ${timestamp}] ⚠ Low resolution`);
        }

        // Estimate brightness
        const brightness = estimateBrightness(canvas, width, height);
        console.log(`[ImageValidation ${timestamp}] Estimated brightness: ${brightness}%`);

        if (brightness < MIN_BRIGHTNESS) {
            warnings.push(`⚠️ Imagen muy oscura (${brightness}%). Para mejores resultados, usa mejor iluminación.`);
            console.warn(`[ImageValidation ${timestamp}] ⚠ Low brightness detected`);
        }

        const isValid = errors.length === 0;

        if (isValid) {
            console.log(`[ImageValidation ${timestamp}] ✓ Validation passed`);
        } else {
            console.error(`[ImageValidation ${timestamp}] ✗ Validation failed:`, errors);
        }

        return {
            isValid,
            errors,
            warnings,
            metadata: {
                width,
                height,
                fileSize: file.size,
                brightness,
            },
        };
    } catch (err) {
        console.error(`[ImageValidation ${timestamp}] ✗ Error during validation:`, err);
        errors.push('Error al analizar la imagen');
        return {
            isValid: false,
            errors,
            warnings,
            metadata: {
                width: 0,
                height: 0,
                fileSize: file.size,
            },
        };
    }
}

/**
 * Load image file and get dimensions + canvas
 */
async function loadImageData(file: File): Promise<{ width: number; height: number; canvas: HTMLCanvasElement }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        let settled = false;

        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            URL.revokeObjectURL(url);
            console.error('[ImageValidation] Timed out loading image for validation');
            reject(new Error('Tiempo de espera agotado al cargar la imagen'));
        }, IMAGE_LOAD_TIMEOUT_MS);

        img.onload = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error('Could not get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            resolve({
                width: img.width,
                height: img.height,
                canvas,
            });
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

/**
 * Estimate image brightness (0-100 scale)
 * Samples pixels from center area of image
 */
function estimateBrightness(canvas: HTMLCanvasElement, width: number, height: number): number {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 50; // Default middle brightness

    // Sample center 25% of image for more accurate food brightness
    const sampleWidth = Math.floor(width * 0.5);
    const sampleHeight = Math.floor(height * 0.5);
    const sampleX = Math.floor(width * 0.25);
    const sampleY = Math.floor(height * 0.25);

    try {
        const imageData = ctx.getImageData(sampleX, sampleY, sampleWidth, sampleHeight);
        const data = imageData.data;

        let totalBrightness = 0;
        let pixelCount = 0;

        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate perceived brightness (weighted for human perception)
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
            totalBrightness += brightness;
            pixelCount++;
        }

        const avgBrightness = totalBrightness / pixelCount;
        return Math.round((avgBrightness / 255) * 100);
    } catch (err) {
        console.warn('[ImageValidation] Could not estimate brightness:', err);
        return 50; // Default middle brightness on error
    }
}

/**
 * Create thumbnail from image file
 * @param file - Image file
 * @param maxSize - Maximum width/height for thumbnail (default: 100)
 * @returns Promise<string> - Base64 data URL
 */
export async function createThumbnail(file: File, maxSize: number = 100): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        let settled = false;

        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            URL.revokeObjectURL(url);
            console.error('[ImageValidation] Timed out creating thumbnail');
            reject(new Error('Tiempo de espera agotado al generar la miniatura'));
        }, IMAGE_LOAD_TIMEOUT_MS);

        img.onload = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);

            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate dimensions maintaining aspect ratio
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

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

            const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
            resolve(thumbnail);
        };

        img.onerror = () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            URL.revokeObjectURL(url);
            reject(new Error('Failed to create thumbnail'));
        };

        img.src = url;
    });
}
