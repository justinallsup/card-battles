import sharp from 'sharp';

export interface ProcessedImage {
  original: Buffer;
  originalMime: string;
  thumbnail: Buffer;
  thumbnailMime: string;
  width: number;
  height: number;
}

const THUMB_MAX_WIDTH = 400;
const THUMB_MAX_HEIGHT = 600;
const THUMB_QUALITY = 80;

export async function processImage(inputBuffer: Buffer, mimeType: string): Promise<ProcessedImage> {
  // Get metadata
  const metadata = await sharp(inputBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Normalize to WebP for consistent storage
  const normalizedOriginal = await sharp(inputBuffer)
    .webp({ quality: 90 })
    .toBuffer();

  // Generate thumbnail
  const thumbnail = await sharp(inputBuffer)
    .resize(THUMB_MAX_WIDTH, THUMB_MAX_HEIGHT, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();

  return {
    original: normalizedOriginal,
    originalMime: 'image/webp',
    thumbnail,
    thumbnailMime: 'image/webp',
    width,
    height,
  };
}

export function validateImageBuffer(buffer: Buffer, maxSize: number = 10 * 1024 * 1024): boolean {
  return buffer.length <= maxSize;
}

export async function generateFallbackSvg(title: string, playerName?: string): Promise<string> {
  const text = playerName || title || 'Card';
  const initials = text
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return `
<svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="600" fill="#1a1a1a"/>
  <rect x="20" y="20" width="360" height="560" fill="#2a2a2a" stroke="#4a4a4a" stroke-width="2" rx="8"/>
  <text x="200" y="300" font-family="Arial, sans-serif" font-size="96" fill="#888" text-anchor="middle" dominant-baseline="middle">${initials}</text>
  <text x="200" y="540" font-family="Arial, sans-serif" font-size="20" fill="#666" text-anchor="middle">${text}</text>
</svg>
  `.trim();
}
