# 🛡️ SafeCheck - AI-Powered Scam Detection Platform

![SafeCheck Logo](https://img.shields.io/badge/SafeCheck-Production%20Ready-green)
![Docker](https://img.shields.io/badge/Docker-Containers-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)

SafeCheck is a comprehensive scam detection platform that analyzes text, URLs, job offers, and images (via OCR) using AI-powered detection algorithms with heuristic fallback systems.

## ✨ Features

- **Multi-Format Detection**: Text, URLs, job offers, and image OCR
- **AI-Powered Analysis**: OpenAI GPT-4 integration for intelligent detection
- **Heuristic Fallback**: Rule-based engine when AI is unavailable
- **Real-time Scanning**: Instant risk assessment with detailed reports
- **Secure Authentication**: JWT-based user authentication
- **Subscription Payments**: Integrated Cashfree payment gateway
- **Modern 3D UI**: Beautiful glassmorphism design with animations
- **Docker Support**: Full containerization for easy deployment

## 🏗️ Architecture
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ React │────▶│ Express │────▶│ MongoDB │
│ Frontend │ │ Backend │ │ Database │
└─────────────┘ └─────────────┘ └─────────────┘
│
┌────┴─────┐
│ OpenAI │
│ Cashfree │
└──────────┘