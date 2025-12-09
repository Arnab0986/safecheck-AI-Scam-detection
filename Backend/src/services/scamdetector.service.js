const axios = require('axios');
const logger = require('../utils/logger');

class ScamDetectorService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-4';
    this.openaiUrl = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * Analyze text for scams using OpenAI with heuristic fallback
   */
  async analyzeText(text, type = 'text') {
    try {
      // Try OpenAI first
      if (this.openaiApiKey && this.openaiApiKey !== 'your_openai_api_key_here') {
        const aiResult = await this.analyzeWithAI(text, type);
        if (aiResult) {
          logger.info(`AI analysis successful for ${type}`);
          return aiResult;
        }
      }
      
      // Fallback to heuristic engine
      logger.info(`Using heuristic engine for ${type}`);
      return this.analyzeWithHeuristics(text, type);
    } catch (error) {
      logger.error('Scam detection error:', error);
      return this.analyzeWithHeuristics(text, type);
    }
  }

  /**
   * Analyze text using OpenAI
   */
  async analyzeWithAI(text, type) {
    const systemPrompt = this.getSystemPrompt(type);
    const userPrompt = this.getUserPrompt(text, type);

    try {
      const response = await axios.post(
        this.openaiUrl,
        {
          model: this.openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const result = JSON.parse(response.data.choices[0].message.content);
      return this.formatAIResult(result, type);
    } catch (error) {
      logger.error('OpenAI API error:', error.message);
      return null;
    }
  }

  /**
   * Analyze text using heuristic rules
   */
  analyzeWithHeuristics(text, type) {
    const lowerText = text.toLowerCase();
    let riskScore = 0;
    const indicators = [];
    const recommendations = [];
    
    // Common scam indicators
    const scamPatterns = {
      urgency: ['urgent', 'immediately', 'right away', 'limited time', 'act now'],
      financial: ['money', 'payment', 'bank', 'account', 'transfer', 'bitcoin', 'crypto'],
      reward: ['won', 'prize', 'reward', 'free', 'gift', 'lottery'],
      threat: ['suspended', 'closed', 'legal action', 'police', 'court'],
      personal: ['password', 'login', 'credentials', 'social security', 'aadhaar'],
      suspicious: ['click here', 'verify', 'confirm', 'update', 'security alert']
    };

    // Type-specific patterns
    const typePatterns = {
      url: ['bit.ly', 'tinyurl', 'shortener', 'http://', 'https://', 'www.'],
      job_offer: ['work from home', 'no experience', 'high salary', 'quick money'],
      invoice: ['invoice', 'payment due', 'overdue', 'account payable', 'remittance']
    };

    // Calculate risk score based on patterns
    Object.entries(scamPatterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        if (lowerText.includes(pattern)) {
          riskScore += 5;
          indicators.push(`${category}: contains "${pattern}"`);
        }
      });
    });

    // Add type-specific patterns
    if (typePatterns[type]) {
      typePatterns[type].forEach(pattern => {
        if (lowerText.includes(pattern)) {
          riskScore += 7;
          indicators.push(`type_specific: contains "${pattern}"`);
        }
      });
    }

    // Check for suspicious URL patterns
    if (type === 'url') {
      const urlRegex = /https?:\/\/([^\/]+)/i;
      const match = text.match(urlRegex);
      if (match) {
        const domain = match[1];
        const suspiciousDomains = [
          'free', 'win', 'prize', 'reward', 'bank', 'secure', 'update',
          'verify', 'login', 'account', 'payment'
        ];
        
        suspiciousDomains.forEach(keyword => {
          if (domain.includes(keyword)) {
            riskScore += 10;
            indicators.push(`suspicious_domain: contains "${keyword}"`);
          }
        });

        // Check for domain age indicators (new domains)
        if (domain.includes('xyz') || domain.includes('top') || domain.includes('club')) {
          riskScore += 5;
          indicators.push('new_tld: uses new TLD');
        }
      }
    }

    // Check for job scam patterns
    if (type === 'job_offer') {
      const jobScamIndicators = [
        'no experience needed',
        'earn money fast',
        'work from anywhere',
        'simple job',
        'high commission'
      ];

      jobScamIndicators.forEach(indicator => {
        if (lowerText.includes(indicator)) {
          riskScore += 8;
          indicators.push(`job_scam: contains "${indicator}"`);
        }
      });
    }

    // Check for invoice scam patterns
    if (type === 'invoice') {
      const invoiceScamIndicators = [
        'payment overdue',
        'immediate payment',
        'account suspended',
        'late fee',
        'urgent attention'
      ];

      invoiceScamIndicators.forEach(indicator => {
        if (lowerText.includes(indicator)) {
          riskScore += 9;
          indicators.push(`invoice_scam: contains "${indicator}"`);
        }
      });
    }

    // Calculate length-based risk (too short might be suspicious)
    if (text.length < 20) {
      riskScore += 15;
      indicators.push('suspicious_length: text is very short');
    }

    // Cap risk score at 100
    riskScore = Math.min(100, riskScore);

    // Generate recommendations based on risk
    if (riskScore >= 80) {
      recommendations.push('This appears to be highly suspicious. Avoid any interaction.');
      recommendations.push('Do not click any links or provide personal information.');
      recommendations.push('Report to authorities if financial loss has occurred.');
    } else if (riskScore >= 60) {
      recommendations.push('Exercise extreme caution with this content.');
      recommendations.push('Verify the source through official channels.');
      recommendations.push('Do not make any payments without verification.');
    } else if (riskScore >= 40) {
      recommendations.push('Be cautious and verify the information.');
      recommendations.push('Check the sender\'s identity through other means.');
    } else if (riskScore >= 20) {
      recommendations.push('This appears mostly safe but stay vigilant.');
    } else {
      recommendations.push('This content appears to be safe.');
    }

    // Determine category
    let category = 'safe';
    if (riskScore >= 80) category = 'fraud';
    else if (riskScore >= 60) category = 'phishing';
    else if (riskScore >= 40) category = 'suspicious';
    else if (riskScore >= 20) category = 'low_risk';

    return {
      isScam: riskScore >= 60,
      confidence: riskScore / 100,
      category,
      riskScore,
      explanation: this.generateExplanation(riskScore, indicators, type),
      indicators: indicators.slice(0, 10), // Limit to 10 indicators
      recommendations,
      detectionMethod: 'heuristic'
    };
  }

  /**
   * Get system prompt for OpenAI
   */
  getSystemPrompt(type) {
    return `You are an expert scam detection system. Analyze the provided ${type} content and determine if it's a scam.
    Return a JSON object with these exact fields:
    - isScam: boolean (true if scam, false if safe)
    - confidence: number between 0 and 1
    - category: string (phishing, fraud, spam, malware, job_scam, invoice_fraud, suspicious, safe, unknown)
    - riskScore: number between 0 and 100
    - explanation: string explaining your analysis
    - indicators: array of strings (specific red flags found)
    - recommendations: array of strings (advice for the user)
    
    Be thorough and consider: urgency tactics, financial requests, suspicious links, grammar errors, too-good-to-be-true offers.`;
  }

  /**
   * Get user prompt for OpenAI
   */
  getUserPrompt(text, type) {
    return `Analyze this ${type} content for scams:
    
    Content: "${text.substring(0, 2000)}"
    
    ${type === 'url' ? 'Note: This is a URL. Check for suspicious domains, redirects, and phishing attempts.' : ''}
    ${type === 'job_offer' ? 'Note: This is a job offer. Check for upfront payments, unrealistic salaries, and vague job descriptions.' : ''}
    ${type === 'invoice' ? 'Note: This is an invoice. Check for payment urgency, incorrect details, and sender verification.' : ''}
    
    Provide your analysis in the specified JSON format.`;
  }

  /**
   * Format AI result to match our schema
   */
  formatAIResult(aiResult, type) {
    return {
      isScam: aiResult.isScam || false,
      confidence: Math.min(Math.max(aiResult.confidence || 0.5, 0), 1),
      category: aiResult.category || 'unknown',
      riskScore: Math.min(Math.max(aiResult.riskScore || 50, 0), 100),
      explanation: aiResult.explanation || 'AI analysis completed',
      indicators: aiResult.indicators || [],
      recommendations: aiResult.recommendations || [],
      detectionMethod: 'ai'
    };
  }

  /**
   * Generate explanation based on risk score and indicators
   */
  generateExplanation(riskScore, indicators, type) {
    if (riskScore >= 80) {
      return `High-risk ${type} detected. Multiple scam indicators found including: ${indicators.slice(0, 3).join(', ')}.`;
    } else if (riskScore >= 60) {
      return `Moderate-risk ${type} detected. Several suspicious elements found: ${indicators.slice(0, 2).join(', ')}.`;
    } else if (riskScore >= 40) {
      return `Low-risk ${type} with some cautionary elements: ${indicators[0] || 'minor concerns'}.`;
    } else if (riskScore >= 20) {
      return `Mostly safe ${type} with minimal concerns.`;
    } else {
      return `Safe ${type} with no significant scam indicators detected.`;
    }
  }
}

module.exports = new ScamDetectorService();