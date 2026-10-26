'use client';

import { startTransition, useActionState, useEffect, useRef, useState } from 'react';
import { submitSignup } from '@/app/actions/signup';
import type { signup as SignupCopy } from '@/content/landing';
import type { consent as ConsentCopy } from '@/content/privacy';
import { track } from '@/lib/analytics';
import { readAttribution, type Attribution } from '@/lib/attribution';
import { UTM_KEYS, type HeroVariant, type SignupField, type SignupState } from '@/lib/signup-fields';
import { ChoiceChips } from './ChoiceChips';
import { SignupSuccess } from './SignupSuccess';

const FIELD_ORDER: SignupField[] = ['email', 'student_status', 'sqld_status', 'ai_subscriptions', 'consent'];

export function SignupForm({
  variant,
  copy,
  consent,
}: {
  variant: HeroVariant;
  copy: typeof SignupCopy;
  consent: typeof ConsentCopy;
}) {
  const [state, formAction, pending] = useActionState<SignupState, FormData>(submitSignup, { status: 'idle' });
  // Only a page rendered from a no-JS submission starts with sent-back values.
  const kept = 'values' in state ? state.values : null;
  const [email, setEmail] = useState(kept?.email ?? '');
  const [studentStatus, setStudentStatus] = useState(kept?.studentStatus ?? '');
  const [sqldStatus, setSqldStatus] = useState(kept?.sqldStatus ?? '');
  const [subscriptions, setSubscriptions] = useState<string[]>(kept?.aiSubscriptions ?? []);
  const [agreed, setAgreed] = useState(kept?.consent ?? false);
  const [attribution, setAttribution] = useState<Attribution>({});
  const formRef = useRef<HTMLFormElement>(null);
  const started = useRef(false);
  const submittedSqld = useRef('');

  useEffect(() => setAttribution(readAttribution()), []);

  useEffect(() => {
    if (state.status === 'success') {
      track('signup_success', { variant, sqld_status: submittedSqld.current });
    } else if (state.status === 'invalid') {
      track('signup_error', { kind: 'validation' });
      const first = FIELD_ORDER.find((f) => state.fieldErrors[f]);
      const target = first ? formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`) : null;
      target?.focus();
    } else if (state.status === 'error') {
      track('signup_error', { kind: 'server' });
    }
  }, [state, variant]);

  if (state.status === 'success') return <SignupSuccess copy={copy.done} />;

  const fieldErrors = state.status === 'invalid' ? state.fieldErrors : {};
  const errorFor = (f: SignupField) => (fieldErrors[f] ? copy.errors[f] : undefined);

  const toggleSubscription = (value: string, checked: boolean) => {
    setSubscriptions((prev) => {
      if (!checked) return prev.filter((v) => v !== value);
      if (value === 'none') return ['none'];
      return [...prev.filter((v) => v !== 'none'), value];
    });
  };

  const onFirstInput = () => {
    if (started.current) return;
    started.current = true;
    track('form_start', { variant });
  };

  return (
    <form
      ref={formRef}
      className="su-form"
      action={formAction}
      noValidate
      onInput={onFirstInput}
      onSubmit={(e) => {
        // Dispatching the action here skips React's automatic form reset, which unchecks the chips after a failed submit.
        e.preventDefault();
        submittedSqld.current = sqldStatus;
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
    >
      <div className="field">
        <label htmlFor="f-email">{copy.fields.email}</label>
        <input
          className="inp"
          id="f-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errorFor('email') ? true : undefined}
          aria-describedby={errorFor('email') ? 'e-email' : undefined}
        />
        {errorFor('email') ? (
          <p className="err" id="e-email">
            {errorFor('email')}
          </p>
        ) : null}
      </div>

      <ChoiceChips
        name="student_status"
        legend={copy.fields.studentStatus}
        type="radio"
        options={copy.options.studentStatus}
        selected={[studentStatus]}
        onToggle={(v) => setStudentStatus(v)}
        error={errorFor('student_status')}
      />
      <ChoiceChips
        name="sqld_status"
        legend={copy.fields.sqldStatus}
        type="radio"
        options={copy.options.sqldStatus}
        selected={[sqldStatus]}
        onToggle={(v) => setSqldStatus(v)}
        error={errorFor('sqld_status')}
      />
      <ChoiceChips
        name="ai_subscriptions"
        legend={copy.fields.aiSubscriptions}
        hint={copy.fields.aiSubscriptionsHint}
        type="checkbox"
        options={copy.options.aiSubscriptions}
        selected={subscriptions}
        onToggle={toggleSubscription}
        error={errorFor('ai_subscriptions')}
      />

      <div className="consent">
        <p className="consent-t">{consent.label}</p>
        <ul>
          {consent.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <a className="consent-link" href="/privacy">
          {consent.policyLink}
        </a>
        <label className="check">
          <input
            type="checkbox"
            name="consent"
            value="on"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-invalid={errorFor('consent') ? true : undefined}
            aria-describedby={errorFor('consent') ? 'e-consent' : undefined}
          />
          {consent.agree}
        </label>
        {errorFor('consent') ? (
          <p className="err" id="e-consent">
            {errorFor('consent')}
          </p>
        ) : null}
      </div>

      <div className="hp" aria-hidden="true">
        <label>
          {copy.fields.honeypot}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="hero_variant" value={variant} />
      {UTM_KEYS.map((k) => (
        <input key={k} type="hidden" name={k} value={attribution[k] ?? ''} />
      ))}
      <input type="hidden" name="referrer_host" value={attribution.referrer_host ?? ''} />

      {state.status === 'error' ? (
        <p className="err" role="alert">
          {copy.errors.server}
        </p>
      ) : null}
      <button type="submit" className="btn btn-ink" disabled={pending}>
        {pending ? copy.submitting : copy.submit}
      </button>
    </form>
  );
}
