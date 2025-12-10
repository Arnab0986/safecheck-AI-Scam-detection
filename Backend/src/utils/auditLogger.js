// backend/src/utils/auditLogger.js
const winston = require('winston');

const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/audit.log',
      level: 'info'
    }),
    new winston.transports.Console()
  ]
});

// Log payment events
function logPaymentEvent(event, data) {
  auditLogger.info({
    event,
    timestamp: new Date().toISOString(),
    ...data,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
}