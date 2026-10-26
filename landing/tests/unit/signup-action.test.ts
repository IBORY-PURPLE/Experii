import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const upsert = vi.fn(async () => ({ error: null }));
vi.mock('@/lib/supabase-server', () => ({ supabaseServer: () => ({ from: () => ({ upsert }) }) }));

const load = async () => {
  vi.resetModules();
  return (await import('@/app/actions/signup')).submitSignup;
};

function validForm() {
  const fd = new FormData();
  for (const [k, v] of [
    ['email', 'student@example.test'],
    ['student_status', 'undergrad'],
    ['sqld_status', 'studying'],
    ['ai_subscriptions', 'chatgpt_paid'],
    ['consent', 'on'],
  ])
    fd.append(k, v);
  return fd;
}

const sent = { email: 'student@example.test', studentStatus: 'undergrad', sqldStatus: 'studying', aiSubscriptions: ['chatgpt_paid'], consent: true };

let error: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  upsert.mockClear();
  error = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  error.mockRestore();
});

describe('submitSignup write flag', () => {
  it('on a production deploy with the flag off, answers an error, keeps the input and logs why, without writing', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('SIGNUP_WRITE_ENABLED', '');
    const submit = await load();
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'error', values: sent });
    expect(upsert).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(String(error.mock.calls[0][0])).toContain('SIGNUP_WRITE_ENABLED');
  });

  it('answers success without writing on preview and local runs with the flag off', async () => {
    for (const env of ['preview', '']) {
      vi.stubEnv('VERCEL_ENV', env);
      vi.stubEnv('SIGNUP_WRITE_ENABLED', '');
      const submit = await load();
      expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'success' });
    }
    expect(upsert).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it('writes when the flag is on in production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('SIGNUP_WRITE_ENABLED', 'true');
    const submit = await load();
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'success' });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });
});

describe('submitSignup sends the input back when it fails', () => {
  it('a validation failure returns the field errors and what the visitor picked', async () => {
    const submit = await load();
    const fd = validForm();
    fd.delete('consent');
    expect(await submit({ status: 'idle' }, fd)).toEqual({
      status: 'invalid',
      fieldErrors: { consent: true },
      values: { ...sent, consent: false },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('a failed write keeps the input too', async () => {
    vi.stubEnv('SIGNUP_WRITE_ENABLED', 'true');
    upsert.mockResolvedValueOnce({ error: { code: '500' } } as never);
    const submit = await load();
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'error', values: sent });
  });
});
