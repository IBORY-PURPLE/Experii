type EventName = 'cta_click' | 'download_click' | 'loop_step' | 'form_start' | 'signup_success' | 'signup_error';
type EventData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => void };
  }
}

export function track(name: EventName, data?: EventData) {
  if (typeof window === 'undefined' || !window.umami) return;
  try {
    window.umami.track(name, data);
  } catch {}
}
