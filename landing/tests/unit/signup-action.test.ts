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

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  upsert.mockClear();
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  warn.mockRestore();
});

describe('submitSignup write flag', () => {
  it('on a production deploy with the flag off, warns once and still answers success without writing', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('SIGNUP_WRITE_ENABLED', '');
    const submit = await load();
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'success' });
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'success' });
    expect(upsert).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('SIGNUP_WRITE_ENABLED');
  });

  it('stays quiet on preview and local runs with the flag off', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('SIGNUP_WRITE_ENABLED', '');
    const submit = await load();
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'success' });
    expect(upsert).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('writes without a warning when the flag is on in production', async () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('SIGNUP_WRITE_ENABLED', 'true');
    const submit = await load();
    expect(await submit({ status: 'idle' }, validForm())).toEqual({ status: 'success' });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });
});
