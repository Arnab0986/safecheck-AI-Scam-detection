const Tesseract = require('tesseract.js');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

class OCRService {
  constructor() {
    this.tmpDir = process.env.OCR_TMP_DIR || '/tmp/ocr';
  }

  async extractText(filePath) {
    try {
      logger.info(`Starting OCR extraction for: ${filePath}`);
      
      // Configure Tesseract
      const { data: { text } } = await Tesseract.recognize(
        filePath,
        'eng+fra+deu+spa', // Multiple languages for better invoice recognition
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              logger.debug(`OCR progress: ${m.progress * 100}%`);
            }
          }
        }
      );

      logger.info(`OCR extraction completed: ${text.length} characters extracted`);
      
      // Clean and normalize text
      const cleanedText = this.cleanText(text);
      
      return cleanedText;

    } catch (error) {
      logger.error(`OCR extraction error: ${error.message}`);
      throw new Error('Failed to extract text from image');
    }
  }

  cleanText(text) {
    if (!text) return '';
    
    // Remove excessive whitespace
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Remove non-printable characters but keep common symbols
    cleaned = cleaned.replace(/[^\x20-\x7E\u00A0-\u024F\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/g, '');
    
    // Fix common OCR errors
    const replacements = [
      [/\b1\s*\/\s*O\b/g, '1/O'], // Invoice number patterns
      [/\b(\d+)[oO]\b/g, '$10'], // Replace o with 0 in numbers
      [/\b[A-Z]\s*[A-Z]\s*[A-Z]\b/g, match => match.replace(/\s+/g, '')], // Remove spaces in abbreviations
      [/\b(B\s*I\s*L\s*L)\b/gi, 'BILL'],
      [/\b(I\s*N\s*V\s*O\s*I\s*C\s*E)\b/gi, 'INVOICE'],
      [/\b(T\s*O\s*T\s*A\s*L)\b/gi, 'TOTAL'],
      [/\b(T\s*A\s*X)\b/gi, 'TAX'],
      [/\b(A\s*M\s*O\s*U\s*N\s*T)\b/gi, 'AMOUNT'],
    ];
    
    replacements.forEach(([pattern, replacement]) => {
      cleaned = cleaned.replace(pattern, replacement);
    });
    
    // Normalize currency symbols
    cleaned = cleaned
      .replace(/\$\s*(\d+)/g, '$$$1')
      .replace(/€\s*(\d+)/g, '€$1')
      .replace(/£\s*(\d+)/g, '£$1')
      .replace(/₹\s*(\d+)/g, '₹$1');
    
    // Extract invoice-like sections (dates, amounts, totals)
    const invoicePatterns = [
      /\b(?:invoice|bill|receipt)\s*(?:no|number|#)?\s*[:#]?\s*([A-Z0-9\-]+)/gi,
      /\b(?:date|issued|created)\s*[:]?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/gi,
      /\b(?:total|amount|balance|due)\s*[:]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{2})?)/gi,
      /\b(?:tax|vat|gst)\s*[:]?\s*[$€£₹]?\s*([\d,]+(?:\.\d{2})?)/gi,
    ];
    
    // Add extracted patterns as context
    const extractedInfo = [];
    invoicePatterns.forEach(pattern => {
      const matches = cleaned.match(pattern);
      if (matches) {
        extractedInfo.push(...matches);
      }
    });
    
    // If we found invoice-like data, prepend it for better analysis
    if (extractedInfo.length > 0) {
      cleaned = `INVOICE DATA EXTRACTED:\n${extractedInfo.join('\n')}\n\nFULL TEXT:\n${cleaned}`;
    }
    
    return cleaned;
  }

  async extractFromMultipleImages(filePaths) {
    try {
      const results = await Promise.all(
        filePaths.map(filePath => this.extractText(filePath))
      );
      
      // Combine all extracted text
      const combinedText = results.join('\n\n--- PAGE BREAK ---\n\n');
      
      return combinedText;
      
    } catch (error) {
      logger.error(`Multi-image OCR error: ${error.message}`);
      throw new Error('Failed to extract text from multiple images');
    }
  }

  async validateImage(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      // Check file size
      if (stats.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('File too large');
      }
      
      // Check if file exists and is readable
      await fs.access(filePath, fs.constants.R_OK);
      
      return true;
      
    } catch (error) {
      logger.error(`Image validation error: ${error.message}`);
      throw new Error('Invalid image file');
    }
  }
}

module.exports = new OCRService();