const Joi = require('joi');

const validators = {
  // User registration validation
  validateRegister: (data) => {
    const schema = Joi.object({
      name: Joi.string()
        .min(2)
        .max(100)
        .required()
        .trim()
        .pattern(/^[a-zA-Z\s]+$/)
        .messages({
          'string.pattern.base': 'Name can only contain letters and spaces',
          'string.empty': 'Name is required',
          'string.min': 'Name must be at least 2 characters',
          'string.max': 'Name cannot exceed 100 characters'
        }),
      email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase()
        .messages({
          'string.email': 'Please enter a valid email address',
          'string.empty': 'Email is required'
        }),
      password: Joi.string()
        .min(6)
        .max(100)
        .required()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .messages({
          'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
          'string.empty': 'Password is required',
          'string.min': 'Password must be at least 6 characters',
          'string.max': 'Password cannot exceed 100 characters'
        })
    });

    return schema.validate(data, { abortEarly: false });
  },

  // User login validation
  validateLogin: (data) => {
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .trim()
        .lowercase()
        .messages({
          'string.email': 'Please enter a valid email address',
          'string.empty': 'Email is required'
        }),
      password: Joi.string()
        .required()
        .messages({
          'string.empty': 'Password is required'
        })
    });

    return schema.validate(data, { abortEarly: false });
  },

  // Text scan validation
  validateTextScan: (data) => {
    const schema = Joi.object({
      text: Joi.string()
        .required()
        .min(1)
        .max(10000)
        .trim()
        .messages({
          'string.empty': 'Text is required',
          'string.min': 'Text must be at least 1 character',
          'string.max': 'Text cannot exceed 10000 characters'
        }),
      type: Joi.string()
        .valid('text', 'url', 'job_offer', 'invoice')
        .default('text')
        .messages({
          'any.only': 'Type must be one of: text, url, job_offer, invoice'
        })
    });

    return schema.validate(data, { abortEarly: false });
  },

  // Payment order validation
  validatePaymentOrder: (data) => {
    const schema = Joi.object({
      plan: Joi.string()
        .valid('monthly', 'yearly')
        .required()
        .messages({
          'any.only': 'Plan must be either monthly or yearly',
          'string.empty': 'Plan is required'
        })
    });

    return schema.validate(data, { abortEarly: false });
  },

  // Payment verification validation
  validatePaymentVerification: (data) => {
    const schema = Joi.object({
      order_id: Joi.string()
        .required()
        .pattern(/^ORDER_\d+_\w+$/)
        .messages({
          'string.pattern.base': 'Invalid order ID format',
          'string.empty': 'Order ID is required'
        })
    });

    return schema.validate(data, { abortEarly: false });
  },

  // URL validation
  validateUrl: (url) => {
    const schema = Joi.string()
      .uri()
      .required()
      .messages({
        'string.uri': 'Please enter a valid URL',
        'string.empty': 'URL is required'
      });

    return schema.validate(url);
  },

  // Email validation
  validateEmail: (email) => {
    const schema = Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required'
      });

    return schema.validate(email);
  },

  // Pagination validation
  validatePagination: (data) => {
    const schema = Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          'number.min': 'Page must be at least 1',
          'number.integer': 'Page must be an integer'
        }),
      limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
          'number.min': 'Limit must be at least 1',
          'number.max': 'Limit cannot exceed 100',
          'number.integer': 'Limit must be an integer'
        }),
      sort: Joi.string()
        .valid('createdAt', 'riskScore', 'type')
        .default('createdAt')
        .messages({
          'any.only': 'Sort must be one of: createdAt, riskScore, type'
        }),
      order: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
        .messages({
          'any.only': 'Order must be either asc or desc'
        })
    });

    return schema.validate(data, { abortEarly: false });
  },

  // File upload validation
  validateFileUpload: (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp'
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { error: errors.join(', ') };
    }

    // Check file type
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file extension
    const extension = file.originalname.toLowerCase().match(/\.[a-z]+$/)?.[0];
    if (!extension || !allowedExtensions.includes(extension)) {
      errors.push(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    if (errors.length > 0) {
      return { error: errors.join(', ') };
    }

    return { value: file };
  },

  // Sanitize input
  sanitizeInput: (input) => {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove HTML tags
        .substring(0, 10000); // Limit length
    }
    return input;
  },

  // Sanitize URL
  sanitizeUrl: (url) => {
    try {
      const parsed = new URL(url);
      
      // Remove fragments and query parameters that might be malicious
      parsed.hash = '';
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Invalid protocol');
      }
      
      return parsed.toString();
    } catch (error) {
      throw new Error('Invalid URL');
    }
  }
};

module.exports = validators;