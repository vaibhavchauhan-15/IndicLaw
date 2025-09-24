/**
 * Document routes for handling document operations
 */
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import { 
  saveDocument, 
  getUserDocuments,
  getDocumentById, 
  deleteDocument,
  getDocumentText,
  extractDocumentText
} from '../services/documentService.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `file-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('File type not allowed. Only PDF, DOCX, and images are supported.'), false);
    }
    
    cb(null, true);
  }
});

// Upload a document
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Save document to database
    const document = await saveDocument(req.file, req.user.id);
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        filename: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Get all documents for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const documents = await getUserDocuments(req.user.id);
    
    res.status(200).json({
      success: true,
      count: documents.length,
      documents: documents.map(doc => ({
        id: doc._id,
        filename: doc.originalName,
        fileType: doc.fileType,
        fileSize: doc.fileSize,
        uploadedAt: doc.uploadedAt,
        accessCount: doc.accessCount,
        textExtracted: doc.textExtracted
      }))
    });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve documents',
      error: error.message
    });
  }
});

// Get a specific document
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const document = await getDocumentById(req.params.id);
    
    // Check if user owns the document
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }
    
    res.status(200).json({
      success: true,
      document: {
        id: document._id,
        filename: document.originalName,
        fileType: document.fileType,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        accessCount: document.accessCount,
        textExtracted: document.textExtracted
      }
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document',
      error: error.message
    });
  }
});

// Get document text content
router.get('/:id/text', authenticateToken, async (req, res) => {
  try {
    const document = await getDocumentById(req.params.id);
    
    // Check if user owns the document
    if (document.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }
    
    // Get document text
    const text = await getDocumentText(req.params.id);
    
    res.status(200).json({
      success: true,
      documentId: document._id,
      filename: document.originalName,
      text
    });
  } catch (error) {
    console.error('Get document text error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve document text',
      error: error.message
    });
  }
});

// Delete a document
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await deleteDocument(req.params.id, req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
});

export default router;