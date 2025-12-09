const ocrService = require('../services/ocr.service');
const scamDetector = require('../services/scamdetector.service');
const Scan = require('../models/Scan.model');
const logger = require('../utils/logger');
const validator = require('../utils/validators');

/**
 * @swagger
 * /api/v1/ocr/extract:
 *   post:
 *     summary: Extract text from image using OCR
 *     tags: [OCR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Text extracted successfully
 */
const extractText = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file provided'
    });
  }

  const userId = req.user.userId;

  try {
    // Check user's scan limit
    const user = await require('../models/User.model').findById(userId);
    if (!user.subscription.active) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysScans = await Scan.countDocuments({
        user: userId,
        createdAt: { $gte: today }
      });
      
      if (todaysScans >= 5) {
        return res.status(403).json({
          success: false,
          error: 'Daily scan limit reached. Please subscribe for unlimited scans.'
        });
      }
    }

    // Process image with OCR
    const extractedText = await ocrService.processImage(req.file.path);
    
    if (!extractedText || extractedText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract sufficient text from image'
      });
    }

    // Analyze extracted text for scams
    const scanResult = await scamDetector.analyzeText(extractedText, 'ocr');

    // Save scan to database
    const scan = await Scan.create({
      user: userId,
      type: 'ocr',
      content: extractedText.substring(0, 1000),
      result: scanResult,
      riskScore: scanResult.riskScore,
      imagePath: req.file.filename
    });

    logger.info(`OCR completed for user ${userId}, text length: ${extractedText.length}`);

    res.json({
      success: true,
      data: {
        extractedText,
        scan: {
          id: scan._id,
          riskScore: scan.riskScore,
          result: scan.result,
          createdAt: scan.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('OCR error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process image'
    });
  }
};

/**
 * @swagger
 * /api/v1/ocr/scan-invoice:
 *   post:
 *     summary: Scan invoice image for scams
 *     tags: [OCR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Invoice scanned successfully
 */
const scanInvoice = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file provided'
    });
  }

  const userId = req.user.userId;

  try {
    // Extract text from invoice
    const extractedText = await ocrService.processImage(req.file.path);
    
    if (!extractedText) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract text from invoice'
      });
    }

    // Analyze specifically for invoice scams
    const scanResult = await scamDetector.analyzeText(extractedText, 'invoice');

    // Save scan
    const scan = await Scan.create({
      user: userId,
      type: 'invoice',
      content: extractedText.substring(0, 1000),
      result: scanResult,
      riskScore: scanResult.riskScore,
      imagePath: req.file.filename
    });

    logger.info(`Invoice scan completed for user ${userId}`);

    res.json({
      success: true,
      data: {
        extractedText,
        scan: {
          id: scan._id,
          riskScore: scan.riskScore,
          result: scan.result,
          createdAt: scan.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Invoice scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to scan invoice'
    });
  }
};

module.exports = {
  extractText,
  scanInvoice
};