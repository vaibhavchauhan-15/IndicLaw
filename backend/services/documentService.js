/**
 * Document service for handling document operations
 */
import fs from 'fs';
import path from 'path';
import { Document } from '../models/index.js';
import { extractTextFromPDF, extractTextFromDocx } from '../utils/fileProcessor.js';
import { extractTextFromImage } from '../utils/imageProcessor.js';

/**
 * Save document information to the database
 * @param {Object} fileInfo - File information
 * @param {string} userId - MongoDB User ID
 * @returns {Object} - Created document
 */
export async function saveDocument(fileInfo, userId) {
  const document = new Document({
    userId,
    filename: fileInfo.filename,
    originalName: fileInfo.originalname,
    fileType: fileInfo.mimetype,
    filePath: fileInfo.path,
    fileSize: fileInfo.size,
    uploadedAt: new Date()
  });
  
  await document.save();
  
  // Start text extraction in the background
  extractDocumentText(document._id).catch(err => {
    console.error(`Error extracting text from document ${document._id}:`, err);
  });
  
  return document;
}

/**
 * Extract text from a document
 * @param {string} documentId - MongoDB Document ID
 * @returns {Object} - Updated document
 */
export async function extractDocumentText(documentId) {
  const document = await Document.findById(documentId);
  
  if (!document) {
    throw new Error(`Document with ID ${documentId} not found`);
  }
  
  if (document.textExtracted) {
    return document; // Text already extracted
  }
  
  try {
    let extractedText = null;
    const fileExtension = path.extname(document.originalName).toLowerCase();
    
    // Extract text based on file type
    if (document.fileType.includes('pdf')) {
      extractedText = await extractTextFromPDF(document.filePath);
    } else if (fileExtension === '.docx' || document.fileType.includes('docx') || document.fileType.includes('word')) {
      extractedText = await extractTextFromDocx(document.filePath);
    } else if (document.fileType.includes('image')) {
      extractedText = await extractTextFromImage(document.filePath);
    }
    
    // Update document with extracted text
    if (extractedText) {
      document.extractedText = extractedText;
      document.textExtracted = true;
      await document.save();
    }
    
    return document;
  } catch (error) {
    console.error(`Error extracting text from ${document.originalName}:`, error);
    
    // Mark as failed but don't throw
    document.metadata.extractionError = error.message;
    await document.save();
    
    return document;
  }
}

/**
 * Get all documents for a user
 * @param {string} userId - MongoDB User ID
 * @returns {Array} - Array of documents
 */
export async function getUserDocuments(userId) {
  return await Document.find({ 
    userId,
    isDeleted: false
  })
  .sort({ uploadedAt: -1 })
  .lean();
}

/**
 * Get a document by ID
 * @param {string} documentId - MongoDB Document ID
 * @returns {Object} - Document details
 */
export async function getDocumentById(documentId) {
  const document = await Document.findById(documentId);
  
  if (!document) {
    throw new Error(`Document with ID ${documentId} not found`);
  }
  
  // Increment access count
  document.accessCount += 1;
  await document.save();
  
  return document;
}

/**
 * Delete a document (soft delete)
 * @param {string} documentId - MongoDB Document ID
 * @param {string} userId - MongoDB User ID (for authorization)
 */
export async function deleteDocument(documentId, userId) {
  const document = await Document.findOne({ _id: documentId, userId });
  
  if (!document) {
    throw new Error(`Document with ID ${documentId} not found or not authorized`);
  }
  
  // Soft delete
  document.isDeleted = true;
  await document.save();
  
  // Don't delete the actual file yet - implement a cleanup cron job later
}

/**
 * Get document text content
 * @param {string} documentId - MongoDB Document ID
 * @returns {string} - Extracted text content
 */
export async function getDocumentText(documentId) {
  const document = await Document.findById(documentId);
  
  if (!document) {
    throw new Error(`Document with ID ${documentId} not found`);
  }
  
  // If text not yet extracted, try to extract it
  if (!document.textExtracted) {
    await extractDocumentText(documentId);
    // Reload document to get the latest data
    const updatedDocument = await Document.findById(documentId);
    return updatedDocument.extractedText || '';
  }
  
  return document.extractedText || '';
}