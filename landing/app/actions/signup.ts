'use server';

import { CONSENT_VERSION } from '@/content/privacy';
import { SignupSchema, fromFormData, toFieldErrors, toRow, type SignupState } from '@/lib/signup-schema';
import { supabaseServer } from '@/lib/supabase-server';

export async function submitSignup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  if (formData.get('website')) return { status: 'success' };

  const parsed = SignupSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return { status: 'invalid', fieldErrors: toFieldErrors(parsed.error) };

  if (process.env.SIGNUP_WRITE_ENABLED !== 'true') return { status: 'success' };

  try {
    const { error } = await supabaseServer()
      .from('waitlist_signups')
      .upsert(toRow(parsed.data, CONSENT_VERSION), { onConflict: 'email', ignoreDuplicates: true });
    if (error) {
      console.error('signup_insert_failed', error.code);
      return { status: 'error' };
    }
  } catch (e) {
    console.error('signup_insert_failed', e instanceof Error ? e.message : 'unknown');
    return { status: 'error' };
  }
  return { status: 'success' };
}
