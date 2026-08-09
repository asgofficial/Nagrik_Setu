import { z } from 'zod';

// ─── Grievance Schemas ───

export const GrievanceCategoryEnum = z.enum([
  'Road', 'Water', 'Electricity', 'Waste', 'Sanitation',
  'Public Safety', 'Transport', 'Corruption', 'Harassment', 'Other'
]);

export const GrievanceSeverityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const GrievanceStatusEnum = z.enum([
  'REPORTED', 'AI_CLASSIFIED', 'VERIFIED', 'ASSIGNED',
  'WORK_STARTED', 'AUTHORITY_RESOLVED', 'CITIZEN_VERIFIED',
  'RESOLUTION_DISPUTED', 'CLOSED'
]);

export const GrievanceCreateSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be under 200 characters')
    .trim(),
  description: z.string()
    .min(15, 'Description must be at least 15 characters')
    .max(5000, 'Description must be under 5000 characters')
    .trim(),
  category: GrievanceCategoryEnum,
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  landmark: z.string().max(200).optional(),
  isAnonymous: z.boolean().default(false),
  evidence: z.array(z.string().url()).max(5).default([]),
});

export const GrievanceUpdateSchema = z.object({
  status: GrievanceStatusEnum,
  note: z.string()
    .min(1, 'Note is required')
    .max(2000, 'Note must be under 2000 characters')
    .trim(),
  evidenceUrl: z.string().url().optional(),
});

export const GrievanceVerifySchema = z.object({
  isSatisfied: z.boolean(),
  note: z.string()
    .min(1, 'Feedback is required')
    .max(2000, 'Feedback must be under 2000 characters')
    .trim(),
});

// ─── Classify Schema ───

export const ClassifyRequestSchema = z.object({
  description: z.string()
    .min(15, 'Description must be at least 15 characters')
    .max(500, 'Description must be under 500 characters')
    .trim(),
});

// ─── Chat Schema ───

export const ChatRequestSchema = z.object({
  message: z.string()
    .min(1, 'Message is required')
    .max(500, 'Message must be under 500 characters')
    .trim(),
});

// ─── Profile Schema ───

export const GenderEnum = z.enum(['male', 'female', 'other', 'prefer-not-to-say']);
export const IncomeRangeEnum = z.enum(['0-1.5L', '1.5L-3L', '3L-5L', '5L-8L', '8L+']);

export const ProfileSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  age: z.number().int().min(1).max(150),
  gender: GenderEnum,
  state: z.string().min(2).max(50),
  district: z.string().min(2).max(50),
  urbanRural: z.enum(['urban', 'rural']),
  incomeRange: IncomeRangeEnum,
  occupation: z.string().max(100).optional(),
});

// ─── Auth Schemas ───

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Please enter a valid email').trim(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be a 10-digit number').optional(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.enum(['citizen', 'officer']).default('citizen'),
  officerCode: z.string().optional(),
});

// ─── Pagination Schema ───

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Query Params Schema ───

export const GrievanceFilterSchema = z.object({
  category: GrievanceCategoryEnum.optional(),
  status: GrievanceStatusEnum.optional(),
  severity: GrievanceSeverityEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
