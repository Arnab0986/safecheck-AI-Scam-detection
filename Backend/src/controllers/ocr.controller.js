const path = require('path');
const fs = require('fs-extra');
const ocrService = require('../services/ocr.service');
const scamDetector = require('../services/scamdetector.service');
const Scan = require('../models/Scan.model');
const User = require('../models/User.model');
const logger = require('../utils/logger');

exports.uploadInvoice = async (req, res) => {
  try {
    const user = req.user;

    // Check if user has OCR access (premium or enterprise)
    if (!['premium', 'enterprise'].includes(user.subscription)) {
      return res.status(402).json({
        success: false,
        error: 'OCR feature requires premium subscription'
      });
    }

    // Check if user has scans left
    if (!user.hasScansLeft()) {
      return res.status(402).json({
        success: false,
        error: 'No scans left. Please upgrade your subscription.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      await fs.remove(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Only JPEG, PNG, and PDF files are allowed'
      });
    }

    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      await fs.remove(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'File size must be less than 10MB'
      });
    }

    logger.info(`OCR processing started for user: ${user.email}, file: ${req.file.originalname}`);

    // Extract text using OCR
    const extractedText = await ocrService.extractText(req.file.path);

    // Clean up uploaded file
    await fs.remove(req.file.path);

    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract sufficient text from the image'
      });
    }

    // Analyze extracted text for scams
    const result = await scamDetector.analyzeInvoice(extractedText);

    // Create scan record
    const scan = new Scan({
      userId: user._id,
      type: 'invoice',
      content: extractedText.substring(0, 2000),
      result: result,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        fileUrl: req.file.filename,
        originalText: extractedText.substring(0, 1000) + (extractedText.length > 1000 ? '...' : '')
      }
    });

    await scan.save();

    // Use one scan from user's quota
    await user.useScan();

    logger.info(`OCR scan completed for user: ${user.email}, Score: ${result.score}`);

    res.status(200).json({
      success: true,
      data: {
        scanId: scan._id,
        extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
        result,
        scansLeft: user.scansLeft
      }
    });

  } catch (error) {
    logger.error(`OCR upload error: ${error.message}`);
    
    // Clean up file if it exists
    if (req.file && req.file.path) {
      await fs.remove(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      success: false,
      error: 'OCR processing failed'
    });
  }
};

exports.getOcrResult = async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id,
      type: 'invoice'
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'OCR result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { scan }
    });

  } catch (error) {
    logger.error(`Get OCR result error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get OCR result'
    });
  }
};