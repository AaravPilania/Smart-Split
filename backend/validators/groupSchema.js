const { z } = require('zod');

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(50, 'Name must be under 50 characters').trim(),
  description: z.string().max(200, 'Description too long').trim().optional().default(''),
  createdBy: z.string().min(1, 'createdBy is required'),
  type: z.enum(['regular', 'trip']).optional().default('regular'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0).optional(),
  budgetCurrency: z.string().max(5).optional(),
  defaultCurrency: z.string().max(5).optional(),
});

module.exports = { createGroupSchema };
