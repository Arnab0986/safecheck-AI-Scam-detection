# SafeCheck - Scam Detection Platform

SafeCheck is a production-ready scam detection platform that analyzes text, URLs, job offers, and invoice images using AI and heuristics.

## Features
- **AI-Powered Detection**: OpenAI GPT-based scam analysis
- **Heuristic Fallback**: Rule-based scoring when AI is unavailable
- **OCR Invoice Analysis**: Extract and analyze text from invoice images
- **Job Offer Verification**: Detect fraudulent job postings
- **URL Safety Check**: Analyze URLs for phishing/scams
- **Subscription System**: Cashfree payment integration
- **Modern 3D UI**: Animated React interface with TailwindCSS

## Tech Stack
**Backend**: Node.js, Express, MongoDB, Tesseract.js, OpenAI API
**Frontend**: React 18, Vite, TailwindCSS, Context API
**DevOps**: Docker, Docker Compose, Render, Vercel

## Quick Start
```bash
# Clone and setup
git clone <repository>
cd safecheck-app

# Start with Docker Compose
docker-compose up --build

# Access the application
Frontend: http://localhost:5173
Backend: http://localhost:4000
API Docs: http://localhost:4000/api-docs