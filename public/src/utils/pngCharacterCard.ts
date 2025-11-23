/**
 * PNG Character Card Utilities
 * Extract Character Card V3 data from PNG files with embedded metadata
 */

import extract from 'png-chunks-extract';
import text from 'png-chunk-text';
import type { CharacterCardV3 } from '../services/api.js';

/**
 * Extract Character Card V3 data from a PNG file
 * Looks for the 'ccv3' tEXt chunk containing base64-encoded JSON
 */
export async function extractCharacterCardFromPNG(file: File): Promise<CharacterCardV3 | null> {
    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Extract all chunks from PNG
        const chunks = extract(uint8Array);

        // Find the ccv3 chunk
        const ccv3Chunk = chunks.find((chunk: any) => {
            if (chunk.name === 'tEXt') {
                try {
                    const decoded = text.decode(chunk.data);
                    return decoded.keyword === 'ccv3';
                } catch {
                    return false;
                }
            }
            return false;
        });

        if (!ccv3Chunk) {
            // Try legacy 'chara' chunk for backward compatibility
            const charaChunk = chunks.find((chunk: any) => {
                if (chunk.name === 'tEXt') {
                    try {
                        const decoded = text.decode(chunk.data);
                        return decoded.keyword === 'chara';
                    } catch {
                        return false;
                    }
                }
                return false;
            });

            if (charaChunk) {
                const decoded = text.decode(charaChunk.data);
                const jsonString = atob(decoded.text); // base64 decode
                const cardData = JSON.parse(jsonString);

                // Convert legacy format to V3 if needed
                if (cardData.spec === 'chara_card_v2') {
                    return convertV2ToV3(cardData);
                }

                return cardData;
            }

            return null;
        }

        // Decode the ccv3 chunk
        const decoded = text.decode(ccv3Chunk.data);

        // The text is base64-encoded JSON
        const jsonString = atob(decoded.text);
        const cardData = JSON.parse(jsonString);

        // Validate it's a V3 card
        if (cardData.spec !== 'chara_card_v3') {
            throw new Error('Invalid character card spec in PNG');
        }

        return cardData;
    } catch (error) {
        console.error('Failed to extract character card from PNG:', error);
        return null;
    }
}

/**
 * Convert Character Card V2 to V3 format
 */
function convertV2ToV3(v2Card: any): CharacterCardV3 {
    return {
        spec: 'chara_card_v3',
        spec_version: '3.0',
        data: {
            name: v2Card.data?.name || '',
            description: v2Card.data?.description || '',
            personality: v2Card.data?.personality || '',
            scenario: v2Card.data?.scenario || '',
            first_mes: v2Card.data?.first_mes || '',
            mes_example: v2Card.data?.mes_example || '',
            creator_notes: v2Card.data?.creator_notes || '',
            system_prompt: v2Card.data?.system_prompt || '',
            post_history_instructions: v2Card.data?.post_history_instructions || '',
            alternate_greetings: v2Card.data?.alternate_greetings || [],
            tags: v2Card.data?.tags || [],
            creator: v2Card.data?.creator || '',
            character_version: v2Card.data?.character_version || '',
            extensions: v2Card.data?.extensions || {},
        },
    };
}

/**
 * Convert image to WebP format with specified max dimensions
 * Returns a Blob of the converted image
 */
export async function convertImageToWebP(
    file: File,
    maxWidth: number = 400,
    maxHeight: number = 400,
    quality: number = 0.85
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            // Calculate new dimensions while maintaining aspect ratio
            let width = img.width;
            let height = img.height;

            if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height;

                if (width > height) {
                    width = maxWidth;
                    height = Math.round(width / aspectRatio);
                } else {
                    height = maxHeight;
                    width = Math.round(height * aspectRatio);
                }
            }

            // Create canvas and draw resized image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            // Use better image smoothing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to WebP
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to convert image to WebP'));
                    }
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

/**
 * Extract the embedded image from PNG file and convert to WebP for avatar
 */
export async function extractAvatarFromPNG(file: File): Promise<Blob> {
    // The PNG file itself is the image, just convert it to WebP
    return convertImageToWebP(file);
}
