'use server';

import { CONSENT_VERSION } from '@/content/privacy';
import type { SignupState } from '@/lib/signup-fields';
import { SignupSchema, fromFormData, toFieldErrors, toRow } from '@/lib/signup-schema';
import { isProductionDeploy } from '@/lib/site';
import { supabaseServer } from '@/lib/supabase-server';

let warnedDryRun = false;

export async function submitSignup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  if (formData.get('website')) return { status: 'success' };

  const parsed = SignupSchema.safeParse(fromFormData(formData));
  if (!parsed.success) return { status: 'invalid', fieldErrors: toFieldErrors(parsed.error) };

  if (process.env.SIGNUP_WRITE_ENABLED !== 'true') {
    if (isProductionDeploy && !warnedDryRun) {
      warnedDryRun = true;
      console.warn('signup_dry_run: SIGNUP_WRITE_ENABLED is not "true" on the production deploy, so signups are answered with success but not saved.');
    }
    return { status: 'success' };
  }

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
