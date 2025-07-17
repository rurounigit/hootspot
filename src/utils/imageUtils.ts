// src/utils/imageUtils.ts

import { createRoot } from 'react-dom/client';
import html2canvas, { Options } from 'html2canvas';

/**
 * Fetches an image, draws it to a canvas to strip any problematic metadata,
 * and returns a "clean" Base64 string compatible with PDF renderers.
 * This is the most robust method for converting local/extension images.
 *
 * @param src The path to the image (e.g., '/images/logo.png').
 * @returns A promise that resolves with the clean Base64 data URL.
 */
export const getCleanBase64FromSrc = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        // 1. Fetch the raw image data from the given source path.
        fetch(src)
            .then(res => res.blob()) // 2. Convert the response into a binary Blob.
            .then(blob => {
                // 3. Create a temporary, safe object URL from the Blob.
                const url = URL.createObjectURL(blob);
                const img = new Image();

                // 4. Once the image is loaded from the safe URL, draw it.
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });

                    if (!ctx) {
                        URL.revokeObjectURL(url); // Clean up the object URL
                        return reject(new Error('Failed to get canvas context.'));
                    }

                    ctx.drawImage(img, 0, 0);

                    // 5. Convert the clean canvas content to a Base64 string.
                    const dataUrl = canvas.toDataURL('image/png');

                    URL.revokeObjectURL(url); // 6. Immediately clean up the object URL.
                    resolve(dataUrl);
                };

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error(`Image failed to load from object URL created from: ${src}`));
                };

                img.src = url;
            })
            .catch(err => reject(new Error(`Failed to fetch image source: ${src}. Error: ${err}`)));
    });
};

/**
 * Captures a React component and converts it to a Base64 image string.
 * This is used for components that do not contain external images, like the D3 chart.
 *
 * @param component The React component (JSX) to capture.
 * @param canvasOptions Options for html2canvas (e.g., scale, backgroundColor).
 * @param containerStyles Optional styles for the temporary container.
 * @returns A promise that resolves with the Base64 string of the image.
 */
export const componentToImage = async (
    component: React.ReactNode,
    canvasOptions: Partial<Options> = {},
    containerStyles: Partial<CSSStyleDeclaration> = {}
): Promise<string> => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    Object.assign(container.style, containerStyles);
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(component);

    await new Promise(resolve => setTimeout(resolve, 50));

    try {
        const canvas = await html2canvas(container, {
            backgroundColor: null,
            ...canvasOptions
        });
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.error("Failed to convert component to image:", error);
        return '';
    } finally {
        root.unmount();
        if (document.body.contains(container)) {
            document.body.removeChild(container);
        }
    }
};