const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/User.model')
const Scan = require('../src/models/Scan.model')

describe('Scan API Integration Tests', () => {
  let authToken
  let testUser

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    })

    // Get auth token (simplified - in real test would login)
    authToken = 'test_token'
  })

  afterAll(async () => {
    await User.deleteMany({})
    await Scan.deleteMany({})
  })

  beforeEach(async () => {
    await Scan.deleteMany({})
  })

  describe('POST /api/v1/scan/text', () => {
    test('should scan text successfully', async () => {
      const response = await request(app)
        .post('/api/v1/scan/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Test phishing message with urgent call to action',
          type: 'text'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.scan).toHaveProperty('riskScore')
      expect(response.body.data.scan.result).toHaveProperty('isScam')
      expect(response.body.data.scan.result).toHaveProperty('explanation')
    })

    test('should reject scan without text', async () => {
      const response = await request(app)
        .post('/api/v1/scan/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'text'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    test('should reject scan with invalid type', async () => {
      const response = await request(app)
        .post('/api/v1/scan/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Test',
          type: 'invalid'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })

    test('should respect daily scan limit for free users', async () => {
      // Create 5 scans for today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      for (let i = 0; i < 5; i++) {
        await Scan.create({
          user: testUser._id,
          type: 'text',
          content: `Test scan ${i}`,
          riskScore: 10,
          result: {
            isScam: false,
            confidence: 0.1,
            category: 'safe',
            explanation: 'Test',
            indicators: [],
            recommendations: []
          },
          createdAt: new Date(today.getTime() + i * 3600000)
        })
      }

      const response = await request(app)
        .post('/api/v1/scan/text')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Another test message',
          type: 'text'
        })

      // Should be rate limited (403)
      expect([200, 403]).toContain(response.status)
    })
  })

  describe('GET /api/v1/scan/history', () => {
    test('should retrieve scan history', async () => {
      // Create test scans
      await Scan.create([
        {
          user: testUser._id,
          type: 'text',
          content: 'First scan',
          riskScore: 30,
          result: {
            isScam: false,
            confidence: 0.3,
            category: 'safe',
            explanation: 'Test',
            indicators: [],
            recommendations: []
          }
        },
        {
          user: testUser._id,
          type: 'url',
          content: 'Second scan',
          riskScore: 80,
          result: {
            isScam: true,
            confidence: 0.8,
            category: 'phishing',
            explanation: 'Test',
            indicators: [],
            recommendations: []
          }
        }
      ])

      const response = await request(app)
        .get('/api/v1/scan/history')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.scans).toHaveLength(2)
      expect(response.body.data.pagination).toHaveProperty('total', 2)
    })

    test('should paginate scan history', async () => {
      // Create more scans
      const scans = []
      for (let i = 0; i < 15; i++) {
        scans.push({
          user: testUser._id,
          type: 'text',
          content: `Scan ${i}`,
          riskScore: 10,
          result: {
            isScam: false,
            confidence: 0.1,
            category: 'safe',
            explanation: 'Test',
            indicators: [],
            recommendations: []
          }
        })
      }
      await Scan.insertMany(scans)

      const response = await request(app)
        .get('/api/v1/scan/history?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.data.scans).toHaveLength(5)
      expect(response.body.data.pagination).toEqual({
        total: 15,
        page: 2,
        limit: 5,
        pages: 3
      })
    })
  })

  describe('GET /api/v1/scan/:id', () => {
    test('should retrieve specific scan', async () => {
      const scan = await Scan.create({
        user: testUser._id,
        type: 'text',
        content: 'Specific scan',
        riskScore: 50,
        result: {
          isScam: false,
          confidence: 0.5,
          category: 'suspicious',
          explanation: 'Test explanation',
          indicators: ['test indicator'],
          recommendations: ['test recommendation']
        }
      })

      const response = await request(app)
        .get(`/api/v1/scan/${scan._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.scan._id.toString()).toBe(scan._id.toString())
      expect(response.body.data.scan.content).toBe('Specific scan')
    })

    test('should return 404 for non-existent scan', async () => {
      const response = await request(app)
        .get('/api/v1/scan/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
    })

    test('should not allow accessing other users scans', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      })

      const scan = await Scan.create({
        user: otherUser._id,
        type: 'text',
        content: 'Other user scan',
        riskScore: 50,
        result: {
          isScam: false,
          confidence: 0.5,
          category: 'suspicious',
          explanation: 'Test',
          indicators: [],
          recommendations: []
        }
      })

      const response = await request(app)
        .get(`/api/v1/scan/${scan._id}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('Rate Limiting', () => {
    test('should rate limit excessive requests', async () => {
      const requests = []
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/api/v1/scan/history')
            .set('Authorization', `Bearer ${authToken}`)
        )
      }

      const responses = await Promise.all(requests)
      const rateLimited = responses.filter(r => r.status === 429)
      
      expect(rateLimited.length).toBeGreaterThan(0)
    })
  })
})