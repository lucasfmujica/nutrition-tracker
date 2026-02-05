/**
 * Chart Export Utility
 * Exports chart/component as PNG image using html2canvas
 */

import html2canvas from 'html2canvas';

/**
 * Export a chart or component as PNG
 * @param elementRef - HTML element to capture
 * @param filename - Filename for download (without extension)
 * @returns Promise<void>
 */
export async function exportChartAsPNG(
    elementRef: HTMLElement,
    filename: string
): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(`[ChartExport ${timestamp}] Starting export: ${filename}`);

    try {
        // Capture element as canvas
        const canvas = await html2canvas(elementRef, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality (2x resolution)
            logging: false,
            useCORS: true, // Handle cross-origin images
            allowTaint: false,
        });

        console.log(
            `[ChartExport ${timestamp}] ✓ Canvas created: ${canvas.width}x${canvas.height}px`
        );

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create image blob');
            }

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = url;

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(url);

            console.log(`[ChartExport ${timestamp}] ✓ Export successful: ${filename}.png`);
        }, 'image/png');
    } catch (err) {
        console.error(`[ChartExport ${timestamp}] ✗ Export failed:`, err);
        throw new Error('Error al exportar la imagen. Intenta nuevamente.');
    }
}

/**
 * Export multiple charts as a single PNG (stacked vertically)
 * @param elementRefs - Array of HTML elements to capture
 * @param filename - Filename for download (without extension)
 * @returns Promise<void>
 */
export async function exportMultipleChartsAsPNG(
    elementRefs: HTMLElement[],
    filename: string
): Promise<void> {
    const timestamp = new Date().toISOString();
    console.log(
        `[ChartExport ${timestamp}] Starting multi-export: ${filename} (${elementRefs.length} charts)`
    );

    try {
        // Capture all elements as canvases
        const canvases = await Promise.all(
            elementRefs.map((ref) =>
                html2canvas(ref, {
                    backgroundColor: '#ffffff',
                    scale: 2,
                    logging: false,
                    useCORS: true,
                    allowTaint: false,
                })
            )
        );

        // Calculate combined dimensions
        const totalWidth = Math.max(...canvases.map((c) => c.width));
        const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
        const spacing = 40; // 40px spacing between charts
        const finalHeight = totalHeight + spacing * (canvases.length - 1);

        console.log(
            `[ChartExport ${timestamp}] Combined size: ${totalWidth}x${finalHeight}px`
        );

        // Create combined canvas
        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.width = totalWidth;
        combinedCanvas.height = finalHeight;
        const ctx = combinedCanvas.getContext('2d');

        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalWidth, finalHeight);

        // Draw each chart
        let currentY = 0;
        canvases.forEach((canvas) => {
            ctx.drawImage(canvas, 0, currentY);
            currentY += canvas.height + spacing;
        });

        // Convert to blob and download
        combinedCanvas.toBlob((blob) => {
            if (!blob) {
                throw new Error('Failed to create combined image blob');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = url;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            console.log(`[ChartExport ${timestamp}] ✓ Multi-export successful`);
        }, 'image/png');
    } catch (err) {
        console.error(`[ChartExport ${timestamp}] ✗ Multi-export failed:`, err);
        throw new Error('Error al exportar las imágenes. Intenta nuevamente.');
    }
}

/**
 * Check if html2canvas is available (useful for error handling)
 */
export function isExportAvailable(): boolean {
    try {
        return typeof html2canvas !== 'undefined';
    } catch {
        return false;
    }
}
