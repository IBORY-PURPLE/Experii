// Field values shared by the signup form (client) and its zod schema (server). Keep zod out of this file.
export const STUDENT_STATUSES = ['undergrad', 'job_seeker', 'other'] as const;
export const SQLD_STATUSES = ['studying', 'planning', 'certified', 'none'] as const;
export const AI_SUBSCRIPTIONS = ['chatgpt_paid', 'claude_paid', 'none'] as const;
export const HERO_VARIANTS = ['h1', 'h2', 'h3'] as const;
export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];
export type SignupField = 'email' | 'student_status' | 'sqld_status' | 'ai_subscriptions' | 'consent';

export type SignupState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'invalid'; fieldErrors: Partial<Record<SignupField, true>> }
  | { status: 'error' };
