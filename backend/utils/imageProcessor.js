/**
 * Image processing utilities for extracting text from images using OCR
 */
import Tesseract from 'tesseract.js';

/**
 * Extract text from an image using OCR
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromImage(imagePath) {
  try {
    console.log(`Processing image: ${imagePath}`);
    const { data: { text } } = await Tesseract.recognize(
      imagePath, 
      'eng', // language code for English
      { logger: progress => { 
        if (progress.status === 'recognizing text') {
          console.log(`OCR progress: ${Math.floor(progress.progress * 100)}%`);
        }
      }}
    );
    return text;
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw new Error(`Failed to extract text from image: ${error.message}`);
  }
}

/**
 * Check if a file is a supported image format
 * @param {string} mimeType - MIME type of the file
 * @returns {boolean} - Whether the file is a supported image
 */
export function isSupportedImageFormat(mimeType) {
  const supportedFormats = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff'
  ];
  
  return supportedFormats.includes(mimeType);
}
