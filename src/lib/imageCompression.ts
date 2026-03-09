/**
 * Image Compression Utility
 * Compress and resize images before upload
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeInMB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  maxSizeInMB: 1,
};

/**
 * Compress image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<{ blob: Blob; dataUrl: string }> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > opts.maxWidth!) {
            height *= opts.maxWidth! / width;
            width = opts.maxWidth!;
          }
        } else {
          if (height > opts.maxHeight!) {
            width *= opts.maxHeight! / height;
            height = opts.maxHeight!;
          }
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image with white background (for transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob'));
              return;
            }
            
            // Convert to data URL for preview
            const dataUrl = canvas.toDataURL('image/jpeg', opts.quality);
            
            resolve({ blob, dataUrl });
          },
          'image/jpeg',
          opts.quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Get file size in MB
 */
export function getFileSizeInMB(file: File | Blob): number {
  return file.size / (1024 * 1024);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if image needs compression
 */
export function needsCompression(file: File, maxSizeInMB: number = 1): boolean {
  return getFileSizeInMB(file) > maxSizeInMB;
}

/**
 * Auto compress image with multiple attempts if needed
 */
export async function autoCompressImage(
  file: File,
  targetSizeInMB: number = 1
): Promise<{ blob: Blob; dataUrl: string; originalSize: string; compressedSize: string }> {
  const originalSize = formatFileSize(file.size);
  
  // If file is already small enough, just convert to JPEG
  if (!needsCompression(file, targetSizeInMB)) {
    const { blob, dataUrl } = await compressImage(file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.9,
    });
    return {
      blob,
      dataUrl,
      originalSize,
      compressedSize: formatFileSize(blob.size),
    };
  }
  
  // Try compression with decreasing quality
  const qualities = [0.8, 0.7, 0.6, 0.5];
  let lastResult: { blob: Blob; dataUrl: string } | null = null;
  
  for (const quality of qualities) {
    const result = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality,
    });
    
    lastResult = result;
    
    // If compressed size is good enough, return it
    if (getFileSizeInMB(result.blob) <= targetSizeInMB) {
      return {
        blob: result.blob,
        dataUrl: result.dataUrl,
        originalSize,
        compressedSize: formatFileSize(result.blob.size),
      };
    }
  }
  
  // Return the best attempt even if not ideal
  if (lastResult) {
    return {
      blob: lastResult.blob,
      dataUrl: lastResult.dataUrl,
      originalSize,
      compressedSize: formatFileSize(lastResult.blob.size),
    };
  }
  
  throw new Error('Failed to compress image');
}
