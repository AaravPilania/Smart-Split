const { z } = require('zod');

const recurringBillSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  amount: z.number().min(0.01),
  billingDay: z.number().int().min(1).max(28),
  category: z.string().max(30).optional().default('utilities'),
  active: z.boolean().optional().default(true),
});

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(50, 'Name must be under 50 characters').trim(),
  description: z.string().max(200, 'Description too long').trim().optional().default(''),
  createdBy: z.string().min(1, 'createdBy is required'),
  type: z.enum(['regular', 'trip', 'home', 'couple']).optional().default('regular'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  budgetCurrency: z.string().max(5).optional(),
  defaultCurrency: z.string().max(5).optional(),
  recurringBills: z.array(recurringBillSchema).optional(),
});

module.exports = { createGroupSchema, recurringBillSchema };
