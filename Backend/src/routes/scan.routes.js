const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scan.controller');
const authMiddleware = require('../middleware/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Scan
 *   description: Text, URL, and job offer scanning
 */

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
 *                 example: "You've won a prize! Click here to claim."
 *               type:
 *                 type: string
 *                 enum: [text, job_offer, url]
 *                 default: text
 *     responses:
 *       200:
 *         description: Scan completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     scan:
 *                       type: object
 */
router.post('/text', authMiddleware, scanController.scanText);

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
 *         description: Number of scans per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Scan history retrieved
 */
router.get('/history', authMiddleware, scanController.getScanHistory);

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
 *         description: Scan ID
 *     responses:
 *       200:
 *         description: Scan result retrieved
 */
router.get('/:id', authMiddleware, scanController.getScanById);

module.exports = router;