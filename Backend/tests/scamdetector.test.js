const scamDetector = require('../src/services/scamdetector.service')

describe('Scam Detector Service', () => {
  describe('Heuristic Analysis', () => {
    test('should detect high-risk phishing text', () => {
      const text = 'URGENT: Your account will be suspended. Click here to verify: http://secure-bank-update.com'
      const result = scamDetector.analyzeWithHeuristics(text, 'text')
      
      expect(result.isScam).toBe(true)
      expect(result.riskScore).toBeGreaterThan(60)
      expect(result.category).toBe('phishing')
      expect(result.indicators.length).toBeGreaterThan(0)
    })

    test('should detect job scams with unrealistic offers', () => {
      const text = 'Earn $5000 monthly from home. No experience needed. Just pay $99 registration fee.'
      const result = scamDetector.analyzeWithHeuristics(text, 'job_offer')
      
      expect(result.isScam).toBe(true)
      expect(result.indicators).toContain(expect.stringContaining('upfront payment'))
    })

    test('should detect invoice fraud', () => {
      const text = 'INVOICE OVERDUE: Immediate payment required. Account will be closed. Pay $1999 now.'
      const result = scamDetector.analyzeWithHeuristics(text, 'invoice')
      
      expect(result.riskScore).toBeGreaterThan(70)
      expect(result.category).toBe('invoice_fraud')
    })

    test('should mark safe content as low risk', () => {
      const text = 'Hello, please find attached the quarterly report for your review.'
      const result = scamDetector.analyzeWithHeuristics(text, 'text')
      
      expect(result.isScam).toBe(false)
      expect(result.riskScore).toBeLessThan(30)
      expect(result.category).toBe('safe')
    })

    test('should detect suspicious URLs', () => {
      const text = 'http://free-prize-win-now.xyz/claim'
      const result = scamDetector.analyzeWithHeuristics(text, 'url')
      
      expect(result.isScam).toBe(true)
      expect(result.indicators).toContain(expect.stringContaining('suspicious_domain'))
    })

    test('should handle empty text', () => {
      const text = ''
      const result = scamDetector.analyzeWithHeuristics(text, 'text')
      
      expect(result.riskScore).toBeGreaterThan(0)
      expect(result.indicators).toContain(expect.stringContaining('suspicious_length'))
    })
  })

  describe('System Prompts', () => {
    test('should generate correct system prompt for URLs', () => {
      const prompt = scamDetector.getSystemPrompt('url')
      expect(prompt).toContain('URL')
      expect(prompt).toContain('phishing')
    })

    test('should generate correct user prompt', () => {
      const prompt = scamDetector.getUserPrompt('test text', 'job_offer')
      expect(prompt).toContain('job offer')
      expect(prompt).toContain('upfront payments')
    })
  })

  describe('Format AI Result', () => {
    test('should format AI result correctly', () => {
      const aiResult = {
        isScam: true,
        confidence: 0.85,
        category: 'phishing',
        riskScore: 85,
        explanation: 'Test explanation',
        indicators: ['test1', 'test2'],
        recommendations: ['rec1', 'rec2']
      }

      const formatted = scamDetector.formatAIResult(aiResult, 'text')
      
      expect(formatted.isScam).toBe(true)
      expect(formatted.confidence).toBe(0.85)
      expect(formatted.category).toBe('phishing')
      expect(formatted.riskScore).toBe(85)
      expect(formatted.detectionMethod).toBe('ai')
    })

    test('should handle missing AI result fields', () => {
      const aiResult = { isScam: false }
      const formatted = scamDetector.formatAIResult(aiResult, 'text')
      
      expect(formatted.isScam).toBe(false)
      expect(formatted.confidence).toBe(0.5)
      expect(formatted.riskScore).toBe(50)
      expect(formatted.detectionMethod).toBe('ai')
    })
  })

  describe('Explanation Generation', () => {
    test('should generate appropriate explanation for high risk', () => {
      const explanation = scamDetector.generateExplanation(85, ['urgency', 'financial'], 'url')
      expect(explanation).toContain('High-risk')
      expect(explanation).toContain('url')
    })

    test('should generate appropriate explanation for low risk', () => {
      const explanation = scamDetector.generateExplanation(15, [], 'text')
      expect(explanation).toContain('Safe')
    })
  })
})

describe('Integration: Full Analysis Flow', () => {
  test('should analyze text with heuristics when AI fails', async () => {
    // Mock OpenAI failure
    const originalKey = process.env.OPENAI_API_KEY
    process.env.OPENAI_API_KEY = 'invalid_key'
    
    const text = 'Test phishing message'
    const result = await scamDetector.analyzeText(text, 'text')
    
    expect(result).toBeDefined()
    expect(result.detectionMethod).toBe('heuristic')
    
    process.env.OPENAI_API_KEY = originalKey
  })

  test('should handle various text lengths', () => {
    const shortText = 'Hi'
    const longText = 'A'.repeat(10000)
    
    const shortResult = scamDetector.analyzeWithHeuristics(shortText, 'text')
    const longResult = scamDetector.analyzeWithHeuristics(longText, 'text')
    
    expect(shortResult.indicators).toContain(expect.stringContaining('suspicious_length'))
    expect(longResult.metadata.length).toBe(10000)
  })
})
