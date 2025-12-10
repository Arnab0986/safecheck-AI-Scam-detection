const Scan = require('../models/Scan.model');
const User = require('../models/User.model');
const scamDetector = require('../services/scamdetector.service');
const logger = require('../utils/logger');
const { scanSchema } = require('../utils/validators');

exports.scanText = async (req, res) => {
  try {
    // Validate input
    const { error } = scanSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { text } = req.body;
    const user = req.user;

    // Check if user has scans left
    if (!user.hasScansLeft()) {
      return res.status(402).json({
        success: false,
        error: 'No scans left. Please upgrade your subscription.'
      });
    }

    // Perform scam detection
    const result = await scamDetector.analyzeText(text);

    // Create scan record
    const scan = new Scan({
      userId: user._id,
      type: 'text',
      content: text.substring(0, 1000), // Store first 1000 chars
      result: result,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        originalText: text.length > 1000 ? text.substring(0, 1000) + '...' : text
      }
    });

    await scan.save();

    // Use one scan from user's quota
    await user.useScan();

    logger.info(`Text scan completed for user: ${user.email}, Score: ${result.score}`);

    res.status(200).json({
      success: true,
      data: {
        scanId: scan._id,
        result,
        scansLeft: user.scansLeft
      }
    });

  } catch (error) {
    logger.error(`Text scan error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Scan failed'
    });
  }
};

exports.scanUrl = async (req, res) => {
  try {
    const { url } = req.body;
    const user = req.user;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    // Check if user has scans left
    if (!user.hasScansLeft()) {
      return res.status(402).json({
        success: false,
        error: 'No scans left. Please upgrade your subscription.'
      });
    }

    // Perform URL analysis
    const result = await scamDetector.analyzeUrl(url);

    // Create scan record
    const scan = new Scan({
      userId: user._id,
      type: 'url',
      content: url,
      result: result,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await scan.save();

    // Use one scan from user's quota
    await user.useScan();

    logger.info(`URL scan completed for user: ${user.email}, URL: ${url}, Score: ${result.score}`);

    res.status(200).json({
      success: true,
      data: {
        scanId: scan._id,
        result,
        scansLeft: user.scansLeft
      }
    });

  } catch (error) {
    logger.error(`URL scan error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'URL scan failed'
    });
  }
};

exports.scanJobOffer = async (req, res) => {
  try {
    const { title, description, company, contact, salary } = req.body;
    const user = req.user;

    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Job description is required'
      });
    }

    // Check if user has scans left
    if (!user.hasScansLeft()) {
      return res.status(402).json({
        success: false,
        error: 'No scans left. Please upgrade your subscription.'
      });
    }

    // Create job offer text for analysis
    const jobText = `
      Job Title: ${title || 'Not specified'}
      Company: ${company || 'Not specified'}
      Contact: ${contact || 'Not specified'}
      Salary: ${salary || 'Not specified'}
      Description: ${description}
    `;

    // Perform job offer analysis
    const result = await scamDetector.analyzeJobOffer(jobText);

    // Create scan record
    const scan = new Scan({
      userId: user._id,
      type: 'job',
      content: jobText.substring(0, 1000),
      result: result,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        title,
        company,
        contact,
        salary
      }
    });

    await scan.save();

    // Use one scan from user's quota
    await user.useScan();

    logger.info(`Job offer scan completed for user: ${user.email}, Score: ${result.score}`);

    res.status(200).json({
      success: true,
      data: {
        scanId: scan._id,
        result,
        scansLeft: user.scansLeft
      }
    });

  } catch (error) {
    logger.error(`Job offer scan error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Job offer scan failed'
    });
  }
};

exports.getScanHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (type) {
      query.type = type;
    }

    const scans = await Scan.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-metadata.ipAddress -metadata.userAgent');

    const total = await Scan.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        scans,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    logger.error(`Get scan history error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get scan history'
    });
  }
};

exports.getScanById = async (req, res) => {
  try {
    const scan = await Scan.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: 'Scan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { scan }
    });

  } catch (error) {
    logger.error(`Get scan by ID error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get scan'
    });
  }
};