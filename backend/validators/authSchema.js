const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long').trim(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  otp: z.string().length(6, 'Verification code must be 6 digits').regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { signupSchema, loginSchema };
