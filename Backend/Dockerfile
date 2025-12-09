FROM node:20-alpine

WORKDIR /app

# Install dependencies for Tesseract and Sharp
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    libpng \
    libjpeg-turbo \
    libwebp \
    giflib \
    librsvg

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Create upload directories
RUN mkdir -p uploads /tmp/ocr

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {if(r.statusCode===200)process.exit(0);process.exit(1)})"

# Start the application
CMD ["node", "src/app.js"]