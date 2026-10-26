import { UTM_KEYS } from './signup-schema';

export type Attribution = Partial<Record<(typeof UTM_KEYS)[number] | 'referrer_host', string>>;

const STORAGE_KEY = 'experii_attr';

export function parseAttribution(search: string, referrer: string): Attribution {
  const params = new URLSearchParams(search);
  const out: Attribution = {};
  for (const key of UTM_KEYS) {
    const v = params.get(key)?.trim();
    if (v) out[key] = v.slice(0, 100);
  }
  if (referrer) {
    try {
      const host = new URL(referrer).host;
      if (host) out.referrer_host = host.slice(0, 255);
    } catch {
      // referrer가 URL이 아니면 버린다
    }
  }
  return out;
}

export function readAttribution(): Attribution {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Attribution;
  } catch {
    // 인앱 브라우저·사생활 보호 모드에서 sessionStorage가 막혀도 신청은 된다
  }
  const parsed = parseAttribution(location.search, document.referrer);
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {}
  return parsed;
}
