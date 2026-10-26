type EventName = 'cta_click' | 'download_click' | 'loop_step' | 'form_start' | 'signup_success' | 'signup_error';
type EventData = Record<string, string | number>;
type Call = [EventName, EventData | undefined];

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => void };
    __earlyDownloads?: string[];
  }
}

// Download clicks made before hydration, kept by the inline script in app/layout.tsx. Taking them
// also stops that script from collecting, so later clicks are counted once, by CtaTracker.
export function takeEarlyDownloads(): string[] {
  const early = window.__earlyDownloads ?? [];
  window.__earlyDownloads = undefined;
  return early;
}

// The umami script loads after hydration (instrumentation-client.ts), so events from the first moments of a visit
// (a deep link straight into section 4) would otherwise be lost.
const MAX_HELD = 30;
const POLL_MS = 250;
const GIVE_UP_MS = 20_000;

type Queue =
  | { state: 'idle' }
  | { state: 'holding'; calls: Call[]; timer: ReturnType<typeof setInterval> }
  | { state: 'closed' };
let queue: Queue = { state: 'idle' };

function send([name, data]: Call) {
  try {
    window.umami?.track(name, data);
  } catch {}
}

function close() {
  if (queue.state === 'holding') clearInterval(queue.timer);
  queue = { state: 'closed' };
}

function flush() {
  if (queue.state !== 'holding') return;
  const { calls } = queue;
  close();
  calls.forEach(send);
}

function hold(call: Call) {
  if (queue.state === 'closed') return;
  if (queue.state === 'holding') {
    if (queue.calls.length < MAX_HELD) queue.calls.push(call);
    return;
  }
  const since = Date.now();
  const timer = setInterval(() => {
    if (window.umami) flush();
    else if (Date.now() - since >= GIVE_UP_MS) close();
  }, POLL_MS);
  queue = { state: 'holding', calls: [call], timer };
}

export function track(name: EventName, data?: EventData) {
  if (typeof window === 'undefined') return;
  if (!window.umami) return hold([name, data]);
  flush();
  send([name, data]);
}
