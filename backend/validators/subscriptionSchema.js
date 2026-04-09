const { z } = require('zod');

const BILLING_CYCLES = ['weekly', 'monthly', 'quarterly', 'yearly'];

const createSubscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').trim(),
  amount: z.number({ coerce: true }).positive('Amount must be positive').max(999999, 'Amount too large'),
  category: z.string().max(50).trim().optional().default('subscription'),
  billingCycle: z.enum(BILLING_CYCLES).optional().default('monthly'),
  nextBillingDate: z.string().min(1, 'Next billing date is required').refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Invalid date' }
  ),
  color: z.string().max(20).optional().default('#6b7280'),
  icon: z.string().max(500).optional().default(''),
  sharedWith: z.array(z.string()).optional().default([]),
});

const updateSubscriptionSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  amount: z.number({ coerce: true }).positive().max(999999).optional(),
  category: z.string().max(50).trim().optional(),
  billingCycle: z.enum(BILLING_CYCLES).optional(),
  nextBillingDate: z.string().refine(
    (v) => !isNaN(Date.parse(v)),
    { message: 'Invalid date' }
  ).optional(),
  active: z.boolean({ coerce: true }).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(500).optional(),
  sharedWith: z.array(z.string()).optional(),
});

module.exports = { createSubscriptionSchema, updateSubscriptionSchema };
