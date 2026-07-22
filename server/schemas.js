const { z } = require('zod');

const preferencesSchema = z.object({
  preferredGenders: z.array(z.enum(['Male', 'Female', 'Non-binary'])).max(3).default([]),
  weights: z.object({
    career: z.number().min(0).max(1).optional(),
    lifestyle: z.number().min(0).max(1).optional(),
    location: z.number().min(0).max(1).optional(),
    language: z.number().min(0).max(1).optional(),
  }).default({}),
}).default({ preferredGenders: [], weights: {} });

const loginSchema = z.object({
  username: z.string().min(3).max(80),
  password: z.string().min(4).max(128),
});

const introSchema = z.object({
  client: z.object({
    id: z.number(),
    firstName: z.string().min(1),
    age: z.number().optional(),
    designation: z.string().min(1),
    email: z.string().email(),
  }).passthrough(),
  match: z.object({
    id: z.number(),
    firstName: z.string().min(1),
    age: z.number().optional(),
    designation: z.string().min(1),
  }).passthrough(),
});

module.exports = { introSchema, loginSchema, preferencesSchema };
