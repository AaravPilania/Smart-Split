const { z } = require('zod');

const CATEGORIES = ['food', 'travel', 'home', 'entertainment', 'shopping', 'health', 'utilities', 'other'];

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be under 100 characters').trim(),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be positive')
    .max(9_999_999, 'Amount too large'),
  paidBy: z.string().min(1, 'paidBy is required'),
  splitBetween: z
    .array(
      z.object({
        user: z.string().min(1, 'User ID required in split'),
        amount: z.number({ invalid_type_error: 'Split amount must be a number' }).positive('Split amount must be positive'),
      })
    )
    .min(1, 'At least one split entry is required'),
  category: z.enum(CATEGORIES).default('other').optional(),
  currency: z.string().length(3, 'Currency must be 3-letter ISO code').toUpperCase().optional(),
});

const updateExpenseSchema = z.object({
  title: z.string().min(1).max(100).trim().optional(),
  amount: z.number().positive().max(9_999_999).optional(),
  splitBetween: z
    .array(
      z.object({
        user: z.string().min(1),
        amount: z.number().positive(),
      })
    )
    .optional(),
  category: z.enum(CATEGORIES).optional(),
});

const suggestCategorySchema = z.object({
  title: z.string().max(200).optional().default(''),
  ocrText: z.string().max(2000).optional().default(''),
});

module.exports = { createExpenseSchema, updateExpenseSchema, suggestCategorySchema };
