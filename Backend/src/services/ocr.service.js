const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class OCRService {
  constructor() {
    this.workers = {};
    this.tempDir = process.env.OCR_TMP_DIR || '/tmp/ocr';
    this.language = process.env.OCR_LANGUAGE || 'eng';
    
    // Create temp directory if it doesn't exist
    this.ensureTempDir();
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
      logger.info(`Created OCR temp directory: ${this.tempDir}`);
    }
  }

  /**
   * Process image with OCR
   */
  async processImage(imagePath) {
    try {
      // Preprocess image
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Perform OCR
      const result = await Tesseract.recognize(
        processedImagePath,
        this.language,
        {
          logger: m => logger.debug(`OCR: ${JSON.stringify(m)}`),
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!?@#$%^&*()-_=+[]{}|;:\'"<>/~`',
          preserve_interword_spaces: '1'
        }
      );

      // Clean up processed image
      await fs.unlink(processedImagePath).catch(() => {});

      const text = result.data.text.trim();
      logger.info(`OCR completed. Extracted ${text.length} characters`);

      return text;
    } catch (error) {
      logger.error('OCR processing error:', error);
      throw new Error('Failed to process image with OCR');
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(imagePath) {
    const outputPath = path.join(this.tempDir, `processed_${Date.now()}.png`);
    
    try {
      await sharp(imagePath)
        .greyscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen() // Sharpen edges
        .threshold(128) // Apply threshold for black and white
        .toFile(outputPath);

      return outputPath;
    } catch (error) {
      logger.error('Image preprocessing error:', error);
      // Return original path if preprocessing fails
      return imagePath;
    }
  }

  /**
   * Process multiple images
   */
  async processMultipleImages(imagePaths) {
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const text = await this.processImage(imagePath);
        results.push({
          image: path.basename(imagePath),
          text,
          success: true
        });
      } catch (error) {
        results.push({
          image: path.basename(imagePath),
          text: '',
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Extract specific information from OCR text
   */
  extractInformation(text, type = 'general') {
    const information = {
      text,
      length: text.length,
      lines: text.split('\n').filter(line => line.trim()),
      words: text.split(/\s+/).filter(word => word),
      sentences: text.split(/[.!?]+/).filter(sentence => sentence.trim())
    };

    // Type-specific extraction
    switch (type) {
      case 'invoice':
        return this.extractInvoiceInfo(text, information);
      case 'receipt':
        return this.extractReceiptInfo(text, information);
      case 'document':
        return this.extractDocumentInfo(text, information);
      default:
        return information;
    }
  }

  /**
   * Extract invoice information
   */
  extractInvoiceInfo(text, baseInfo) {
    const info = { ...baseInfo };
    
    // Common invoice patterns
    const patterns = {
      invoiceNumber: /\b(?:invoice|bill|receipt)[\s\S]*?(?:no|number|#)[\s:]*([A-Z0-9\-]+)\b/i,
      date: /\b(?:date|dated)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      amount: /\b(?:total|amount|amt|rs|inr)[\s:]*([0-9,]+\.?[0-9]*)\b/i,
      dueDate: /\b(?:due|payment due)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
      company: /\b(?:from|by|company|business)[\s:]*([A-Z][A-Za-z\s&.,]+(?:inc|ltd|llp|pvt)?)\b/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        info[key] = match[1].trim();
      }
    });

    // Extract amounts with regex
    const amountMatches = text.match(/(?:₹|rs|inr|usd|\$)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi);
    if (amountMatches) {
      info.allAmounts = amountMatches.map(amt => amt.trim());
      
      // Try to find the largest amount (likely the total)
      const amounts = amountMatches.map(amt => {
        const num = parseFloat(amt.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num;
      });
      
      if (amounts.length > 0) {
        info.totalAmount = Math.max(...amounts);
      }
    }

    return info;
  }

  /**
   * Extract receipt information
   */
  extractReceiptInfo(text, baseInfo) {
    const info = { ...baseInfo };
    
    // Simple receipt patterns
    const dateMatch = text.match(/\b([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})\b/);
    if (dateMatch) info.date = dateMatch[1];
    
    const timeMatch = text.match(/\b([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?(?:\s*[AP]M)?)\b/i);
    if (timeMatch) info.time = timeMatch[1];
    
    return info;
  }

  /**
   * Extract document information
   */
  extractDocumentInfo(text, baseInfo) {
    const info = { ...baseInfo };
    
    // Extract potential headers (lines with few words in all caps)
    const lines = text.split('\n');
    info.headers = lines
      .filter(line => {
        const words = line.trim().split(/\s+/);
        return words.length <= 5 && 
               line === line.toUpperCase() && 
               line.trim().length > 3;
      })
      .map(header => header.trim());

    return info;
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtimeMs > maxAge) {
          await fs.unlink(filePath).catch(() => {});
        }
      }
    } catch (error) {
      logger.error('OCR cleanup error:', error);
    }
  }
}

module.exports = new OCRService();