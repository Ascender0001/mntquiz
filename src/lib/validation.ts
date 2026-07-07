import { z } from 'zod';

export const registrationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  // Phone is optional. When provided it must be a plausible number:
  // optional +, at least 7 digits, allowing spaces / dashes / parentheses.
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine(
      (v) =>
        v === undefined ||
        (/^\+?[0-9\s\-()]{6,30}$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 7),
      'invalid_phone'
    )
});

export const answerSchema = z.object({
  questionId: z.string().min(1),
  optionId: z.string().min(1)
});

export const submitSchema = z.object({
  registration: registrationSchema,
  answers: z.array(answerSchema).min(1),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number()
    })
    .optional()
});

export const configSchema = z.object({
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(50).max(50_000),
  passThreshold: z.number().int().min(0).max(1000),
  questionsPerQuiz: z.number().int().min(1).max(1000)
});

const optionInput = z.object({
  text: z.string().trim().min(1).max(500),
  isCorrect: z.boolean()
});

export const questionSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  category: z.string().trim().max(120).optional().nullable(),
  active: z.boolean().default(true),
  order: z.number().int().default(0),
  options: z
    .array(optionInput)
    .min(2, 'at_least_two_options')
    .refine((opts) => opts.some((o) => o.isCorrect), 'need_correct_option')
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
export type SubmitInput = z.infer<typeof submitSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ConfigInput = z.infer<typeof configSchema>;
