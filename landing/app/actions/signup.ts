'use server';

import { CONSENT_VERSION } from '@/content/privacy';
import type { SignupState } from '@/lib/signup-fields';
import { SignupSchema, fromFormData, toFieldErrors, toRow, toValues } from '@/lib/signup-schema';
import { isProductionDeploy } from '@/lib/site';
import { supabaseServer } from '@/lib/supabase-server';

export async function submitSignup(_prev: SignupState, formData: FormData): Promise<SignupState> {
  if (formData.get('website')) return { status: 'success' };

  const raw = fromFormData(formData);
  const values = toValues(raw);
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return { status: 'invalid', fieldErrors: toFieldErrors(parsed.error), values };

  if (process.env.SIGNUP_WRITE_ENABLED !== 'true') {
    // Local and preview runs answer success without writing (TSD 7.3). On the production deploy that
    // would promise visitors an email while storing nothing, so it fails loudly instead.
    if (!isProductionDeploy) return { status: 'success' };
    console.error('signup_write_disabled: SIGNUP_WRITE_ENABLED is not "true" on the production deploy, so the signup was not saved.');
    return { status: 'error', values };
  }

  try {
    const { error } = await supabaseServer()
      .from('waitlist_signups')
      .upsert(toRow(parsed.data, CONSENT_VERSION), { onConflict: 'email', ignoreDuplicates: true });
    if (error) {
      console.error('signup_insert_failed', error.code);
      return { status: 'error', values };
    }
  } catch (e) {
    console.error('signup_insert_failed', e instanceof Error ? e.message : 'unknown');
    return { status: 'error', values };
  }
  return { status: 'success' };
}
