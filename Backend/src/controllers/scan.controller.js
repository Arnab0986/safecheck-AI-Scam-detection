const Scan = require('../models/Scan.model');
const scamDetector = require('../services/scamdetector.service');
const logger = require('../utils/logger');
const validator = require('../utils/validators');

/**
 * @swagger
 * /api/v1/scan/text:
 *   post:
 *     summary: Scan text for scams
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [text, job_offer, url]
 *     responses:
 *       200:
 *         description: Scan completed
 *       400:
 *         description: Validation error
 */
const scanText = async (req, res) => {
  const { error } = validator.validateTextScan(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message
    });
  }

  const { text, type = 'text' } = req.body;
  const userId = req.user.userId;

  try {
    // Check user's scan limit if not subscribed
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

    // Perform scan
    const scanResult = await scamDetector.analyzeText(text, type);

    // Save scan to database
    const scan = await Scan.create({
      user: userId,
      type,
      content: text.substring(0, 1000), // Store truncated content
      result: scanResult,
      riskScore: scanResult.riskScore
    });

    logger.info(`Scan completed for user ${userId}, type: ${type}, risk: ${scanResult.riskScore}`);

    res.json({
      success: true,
      data: {
        scan: {
          id: scan._id,
          type: scan.type,
          riskScore: scan.riskScore,
          result: scan.result,
          createdAt: scan.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('Scan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process scan'
    });
  }
};

/**
 * @swagger
 * /api/v1/scan/history:
 *   get:
 *     summary: Get user's scan history
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Scan history retrieved
 */
const getScanHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const scans = await Scan.find({ user: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await Scan.countDocuments({ user: req.user.userId });

    res.json({
      success: true,
      data: {
        scans,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get scan history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan history'
    });
  }
};

/**
 * @swagger
 * /api/v1/scan/{id}:
 *   get:
 *     summary: Get specific scan result
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scan result retrieved
 *       404:
 *         description: Scan not found
 */
const getScanById = async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    res.json({
      success: true,
      data: { scan }
    });
  } catch (error) {
    logger.error('Get scan by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scan'
    });
  }
};

module.exports = {
  scanText,
  getScanHistory,
  getScanById
};