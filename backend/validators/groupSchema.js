const { z } = require('zod');

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(50, 'Name must be under 50 characters').trim(),
  description: z.string().max(200, 'Description too long').trim().optional().default(''),
  createdBy: z.string().min(1, 'createdBy is required'),
});

module.exports = { createGroupSchema };
