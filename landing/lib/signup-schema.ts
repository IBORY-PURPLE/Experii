import { z } from 'zod';
import {
  AI_SUBSCRIPTIONS,
  HERO_VARIANTS,
  SQLD_STATUSES,
  STUDENT_STATUSES,
  type SignupField,
  type SignupValues,
} from './signup-fields';

const clipped = (max: number) =>
  z
    .string()
    .optional()
    .transform((v) => {
      const t = v?.trim().slice(0, max);
      return t ? t : null;
    });

export const AttributionSchema = z.object({
  utm_source: clipped(100),
  utm_medium: clipped(100),
  utm_campaign: clipped(100),
  utm_content: clipped(100),
  utm_term: clipped(100),
  referrer_host: clipped(255),
});

export const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  studentStatus: z.enum(STUDENT_STATUSES),
  sqldStatus: z.enum(SQLD_STATUSES),
  aiSubscriptions: z
    .array(z.enum(AI_SUBSCRIPTIONS))
    .min(1)
    .max(2)
    .refine((v) => !v.includes('none') || v.length === 1)
    .refine((v) => new Set(v).size === v.length),
  consent: z.literal('on'),
  heroVariant: z.enum(HERO_VARIANTS).catch('h1'),
  attribution: AttributionSchema,
});

export type SignupInput = z.infer<typeof SignupSchema>;

const PATH_TO_FIELD: Record<string, SignupField> = {
  email: 'email',
  studentStatus: 'student_status',
  sqldStatus: 'sqld_status',
  aiSubscriptions: 'ai_subscriptions',
  consent: 'consent',
};

export function fromFormData(formData: FormData) {
  const text = (key: string) => {
    const v = formData.get(key);
    return typeof v === 'string' ? v : undefined;
  };
  return {
    email: text('email') ?? '',
    studentStatus: text('student_status'),
    sqldStatus: text('sqld_status'),
    aiSubscriptions: formData.getAll('ai_subscriptions').filter((v): v is string => typeof v === 'string'),
    consent: text('consent'),
    heroVariant: text('hero_variant'),
    attribution: {
      utm_source: text('utm_source'),
      utm_medium: text('utm_medium'),
      utm_campaign: text('utm_campaign'),
      utm_content: text('utm_content'),
      utm_term: text('utm_term'),
      referrer_host: text('referrer_host'),
    },
  };
}

export function toValues(raw: ReturnType<typeof fromFormData>): SignupValues {
  return {
    email: raw.email,
    studentStatus: raw.studentStatus ?? '',
    sqldStatus: raw.sqldStatus ?? '',
    aiSubscriptions: raw.aiSubscriptions,
    consent: raw.consent === 'on',
  };
}

export function toFieldErrors(error: z.ZodError): Partial<Record<SignupField, true>> {
  const out: Partial<Record<SignupField, true>> = {};
  for (const issue of error.issues) {
    const field = PATH_TO_FIELD[String(issue.path[0])];
    if (field) out[field] = true;
  }
  return out;
}

export function toRow(input: SignupInput, consentVersion: string) {
  return {
    email: input.email,
    student_status: input.studentStatus,
    sqld_status: input.sqldStatus,
    ai_subscriptions: input.aiSubscriptions,
    consent_version: consentVersion,
    hero_variant: input.heroVariant,
    ...input.attribution,
  };
}
