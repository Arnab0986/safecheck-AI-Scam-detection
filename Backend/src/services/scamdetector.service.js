const OpenAI = require('openai');
const logger = require('../utils/logger');

class ScamDetectorService {
  constructor() {
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;
  }

  async analyzeText(text) {
    try {
      // Try OpenAI first
      if (this.openai) {
        const aiResult = await this.analyzeWithAI(text, 'general text');
        if (aiResult) return aiResult;
      }

      // Fallback to heuristic analysis
      return this.heuristicAnalysis(text, 'text');
    } catch (error) {
      logger.error(`AI analysis failed: ${error.message}`);
      return this.heuristicAnalysis(text, 'text');
    }
  }

  async analyzeUrl(url) {
    try {
      // Try OpenAI first
      if (this.openai) {
        const aiResult = await this.analyzeWithAI(url, 'url');
        if (aiResult) return aiResult;
      }

      // Fallback to heuristic analysis
      return this.heuristicAnalysis(url, 'url');
    } catch (error) {
      logger.error(`URL analysis failed: ${error.message}`);
      return this.heuristicAnalysis(url, 'url');
    }
  }

  async analyzeJobOffer(jobText) {
    try {
      // Try OpenAI first
      if (this.openai) {
        const aiResult = await this.analyzeWithAI(jobText, 'job offer');
        if (aiResult) return aiResult;
      }

      // Fallback to heuristic analysis
      return this.heuristicAnalysis(jobText, 'job');
    } catch (error) {
      logger.error(`Job analysis failed: ${error.message}`);
      return this.heuristicAnalysis(jobText, 'job');
    }
  }

  async analyzeInvoice(invoiceText) {
    try {
      // Try OpenAI first
      if (this.openai) {
        const aiResult = await this.analyzeWithAI(invoiceText, 'invoice');
        if (aiResult) return aiResult;
      }

      // Fallback to heuristic analysis
      return this.heuristicAnalysis(invoiceText, 'invoice');
    } catch (error) {
      logger.error(`Invoice analysis failed: ${error.message}`);
      return this.heuristicAnalysis(invoiceText, 'invoice');
    }
  }

  async analyzeWithAI(content, type) {
    if (!this.openai) return null;

    try {
      const prompt = this.getPromptForType(content, type);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a scam detection expert. Analyze the provided content and determine if it's a scam. Provide a score from 0-100 (0 = completely safe, 100 = definitely a scam), a level (safe, suspicious, dangerous), and a detailed explanation."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const resultText = response.choices[0].message.content;
      return this.parseAIResponse(resultText);

    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      return null;
    }
  }

  getPromptForType(content, type) {
    const prompts = {
      text: `Analyze this text for potential scams, fraud, or malicious intent:\n\n${content}\n\nProvide analysis in this exact JSON format: {"score": number, "level": "safe"|"suspicious"|"dangerous", "explanation": "detailed explanation", "detectedIssues": ["issue1", "issue2"], "confidence": number}`,
      url: `Analyze this URL for potential phishing, scams, or security threats:\n\n${content}\n\nLook for: suspicious domains, typosquatting, shortened URLs, etc. Provide analysis in this exact JSON format: {"score": number, "level": "safe"|"suspicious"|"dangerous", "explanation": "detailed explanation", "detectedIssues": ["issue1", "issue2"], "confidence": number}`,
      job: `Analyze this job offer for potential scams or fraudulent activity:\n\n${content}\n\nLook for: upfront payments, personal information requests, too-good-to-be-true salaries, etc. Provide analysis in this exact JSON format: {"score": number, "level": "safe"|"suspicious"|"dangerous", "explanation": "detailed explanation", "detectedIssues": ["issue1", "issue2"], "confidence": number}`,
      invoice: `Analyze this invoice text for potential scams or fraudulent billing:\n\n${content}\n\nLook for: unusual payment methods, pressure tactics, mismatched details, etc. Provide analysis in this exact JSON format: {"score": number, "level": "safe"|"suspicious"|"dangerous", "explanation": "detailed explanation", "detectedIssues": ["issue1", "issue2"], "confidence": number}`
    };

    return prompts[type] || prompts.text;
  }

  parseAIResponse(responseText) {
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(100, Math.max(0, parsed.score || 50)),
          level: this.getLevelFromScore(parsed.score || 50),
          explanation: parsed.explanation || 'AI analysis completed',
          detectedIssues: parsed.detectedIssues || [],
          confidence: Math.min(100, Math.max(0, parsed.confidence || 80))
        };
      }
    } catch (error) {
      logger.error(`Failed to parse AI response: ${error.message}`);
    }

    // Default fallback
    return {
      score: 50,
      level: 'suspicious',
      explanation: 'AI analysis returned unexpected format',
      detectedIssues: ['Analysis format error'],
      confidence: 50
    };
  }

  heuristicAnalysis(content, type) {
    let score = 0;
    const issues = [];
    
    content = content.toLowerCase();
    
    // Common scam indicators
    const scamIndicators = [
      { pattern: /\b(wire.*transfer|western union|moneygram)\b/i, weight: 20 },
      { pattern: /\b(urgent|immediate|act now|limited time)\b/i, weight: 15 },
      { pattern: /\b(free.*gift|free.*prize|you.*won)\b/i, weight: 20 },
      { pattern: /\b(personal.*information|social.*security|credit.*card)\b/i, weight: 25 },
      { pattern: /\b(payment.*upfront|advance.*fee|processing.*fee)\b/i, weight: 30 },
      { pattern: /\b(click.*here|verify.*account|update.*information)\b/i, weight: 15 },
      { pattern: /\b(nigerian.*prince|inheritance|lottery)\b/i, weight: 40 },
      { pattern: /\b(password|login|credentials)\b/i, weight: 20 },
      { pattern: /bitcoin|crypto|ethereum/i, weight: 10 },
      { pattern: /\b(guaranteed.*profit|risk.*free|high.*return)\b/i, weight: 25 }
    ];
    
    // URL-specific indicators
    if (type === 'url') {
      const urlIndicators = [
        { pattern: /(http:\/\/|https:\/\/).*@/, weight: 30 }, // Embedded credentials
        { pattern: /\.(xyz|top|club|gq|ml|tk|cf|ga)\b/, weight: 10 }, // Suspicious TLDs
        { pattern: /(bit\.ly|goo\.gl|tinyurl|ow\.ly)/, weight: 15 }, // URL shorteners
        { pattern: /(paypal|bank|amazon|microsoft).*\.(com-|net-|org-)/, weight: 35 }, // Typosquatting
        { pattern: /(login|signin|verify|secure)\./, weight: 20 }, // Fake login pages
        { pattern: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, weight: 25 } // IP addresses
      ];
      scamIndicators.push(...urlIndicators);
    }
    
    // Job offer indicators
    if (type === 'job') {
      const jobIndicators = [
        { pattern: /\b(work.*from.*home|earn.*big|no.*experience)\b/i, weight: 15 },
        { pattern: /\b(commission.*only|pay.*per.*click)\b/i, weight: 20 },
        { pattern: /\b(envelope.*stuffing|data.*entry|mystery.*shopper)\b/i, weight: 25 },
        { pattern: /\b(training.*fee|equipment.*fee|background.*check)\b/i, weight: 30 },
        { pattern: /\b(salary.*[\$\£\€]\s*[0-9,]+\s*per\s*(month|week|day))/i, weight: 10 }
      ];
      scamIndicators.push(...jobIndicators);
    }
    
    // Invoice indicators
    if (type === 'invoice') {
      const invoiceIndicators = [
        { pattern: /\b(wire.*payment|direct.*deposit|urgent.*payment)\b/i, weight: 25 },
        { pattern: /\b(overdue|final.*notice|legal.*action)\b/i, weight: 20 },
        { pattern: /\b(tax.*id|vat|ein)\b/i, weight: 15 },
        { pattern: /\b(account.*number|routing.*number|swift.*code)\b/i, weight: 30 },
        { pattern: /\b(payment.*due.*immediately|late.*fee)\b/i, weight: 25 }
      ];
      scamIndicators.push(...invoiceIndicators);
    }
    
    // Calculate score based on indicators
    scamIndicators.forEach(indicator => {
      if (indicator.pattern.test(content)) {
        score += indicator.weight;
        issues.push(`Detected: ${indicator.pattern.toString()}`);
      }
    });
    
    // Length-based scoring (very short or very long content might be suspicious)
    if (content.length < 20) score += 20;
    if (content.length > 5000) score += 15;
    
    // Cap score at 100
    score = Math.min(100, Math.max(0, score));
    
    return {
      score,
      level: this.getLevelFromScore(score),
      explanation: this.getExplanationFromScore(score, type),
      detectedIssues: issues.slice(0, 5), // Limit to 5 issues
      confidence: Math.max(30, 100 - Math.abs(score - 50) * 0.8) // Confidence based on deviation from 50
    };
  }
  
  getLevelFromScore(score) {
    if (score < 30) return 'safe';
    if (score < 70) return 'suspicious';
    return 'dangerous';
  }
  
  getExplanationFromScore(score, type) {
    if (score < 30) {
      return `This ${type} appears to be safe based on heuristic analysis. No major scam indicators were detected.`;
    } else if (score < 70) {
      return `This ${type} shows some suspicious characteristics. Exercise caution and verify through other means.`;
    } else {
      return `This ${type} has strong indications of being a scam. Avoid interacting with it and report if possible.`;
    }
  }
}

module.exports = new ScamDetectorService();