const Joi = require('joi');

// Auth validators
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    }),
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be less than 50 characters',
      'any.required': 'Name is required'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Scan validators
const scanSchema = Joi.object({
  text: Joi.string()
    .min(10)
    .max(10000)
    .required()
    .messages({
      'string.min': 'Text must be at least 10 characters long',
      'string.max': 'Text must be less than 10000 characters',
      'any.required': 'Text is required'
    })
});

const urlSchema = Joi.object({
  url: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Please provide a valid URL',
      'any.required': 'URL is required'
    })
});

const jobOfferSchema = Joi.object({
  title: Joi.string()
    .max(200)
    .optional(),
  description: Joi.string()
    .min(20)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 20 characters long',
      'string.max': 'Description must be less than 5000 characters',
      'any.required': 'Description is required'
    }),
  company: Joi.string()
    .max(100)
    .optional(),
  contact: Joi.string()
    .max(200)
    .optional(),
  salary: Joi.string()
    .max(100)
    .optional()
});

// Payment validators
const createOrderSchema = Joi.object({
  plan: Joi.string()
    .valid('basic', 'premium', 'enterprise')
    .required()
    .messages({
      'any.only': 'Plan must be one of: basic, premium, enterprise',
      'any.required': 'Plan is required'
    }),
  amount: Joi.number()
    .min(100)
    .required()
    .messages({
      'number.min': 'Amount must be at least 100',
      'any.required': 'Amount is required'
    })
});

// Profile validators
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must be less than 50 characters'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  scanSchema,
  urlSchema,
  jobOfferSchema,
  createOrderSchema,
  updateProfileSchema
};