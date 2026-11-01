import { parseSse } from './sse';

export type Transport = {
  baseUrl: string;
  headers(): Promise<Record<string, string>>;
  onUnauthorized(): Promise<boolean>;
  planLabel: 'chatgpt-plan' | 'experii';
};

export type StoredItem = { seq: number; type: string; item_json: string };
export type InputItem = Record<string, unknown> & { type: string };

export type ChatErrorCode =
  | 'unauthorized'
  | 'not_eligible_plan'
  | 'rate_limited'
  | 'context_too_long'
  | 'unsupported'
  | 'incomplete'
  | 'network'
  | 'cancelled'
  | 'tool_limit'
  | 'server';

// param is the request field the server objected to, such as tools[0] for a refused tool.
export class ResponsesError extends Error {
  constructor(
    readonly code: ChatErrorCode,
    message: string = code,
    readonly param?: string,
  ) {
    super(message);
  }
}

export function userMessage(text: string): InputItem {
  return {
    type: 'message',
    role: 'user',
    content: [{ type: 'input_text', text }],
  };
}

// Reasoning only reads back on the model that wrote it, so a saved reasoning item carries that model in x_model.
export function tagModel(item: InputItem, model: string): InputItem {
  return item.type === 'reasoning' ? { ...item, x_model: model } : item;
}

// store:false means the server keeps nothing, so ids would point at items it cannot find. x_ keys are the app's own.
export function sendable(item: InputItem, model?: string): InputItem | null {
  if (
    item.type === 'reasoning' &&
    (!item.encrypted_content || !model || item.x_model !== model)
  )
    return null;
  const out: InputItem = { type: item.type };
  for (const [key, value] of Object.entries(item)) {
    if (key !== 'id' && key !== 'status' && !key.startsWith('x_'))
      out[key] = value;
  }
  return out;
}

export function buildInput(
  items: StoredItem[],
  userText?: string,
  model?: string,
): InputItem[] {
  const out: InputItem[] = [];
  for (const row of [...items].sort((a, b) => a.seq - b.seq)) {
    const item = sendable(JSON.parse(row.item_json) as InputItem, model);
    if (item) out.push(item);
  }
  if (userText !== undefined) out.push(userMessage(userText));
  return out;
}

export function developerMessage(text: string): InputItem {
  return {
    type: 'message',
    role: 'developer',
    content: [{ type: 'input_text', text }],
  };
}

// The direct-token API rejects instructions, previous_response_id, conversation, temperature,
// max_output_tokens and truncation, so the body is limited to these keys.
export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

export type RequestBody = {
  model: string;
  input: InputItem[];
  store: false;
  stream: true;
  include?: string[];
  reasoning?: { effort: ReasoningEffort };
  text?: Record<string, unknown>;
  tools?: unknown[];
};

export const FORBIDDEN_BODY_KEYS = [
  'previous_response_id',
  'conversation',
  'instructions',
  'temperature',
  'max_output_tokens',
  'truncation',
] as const;

export function buildRequestBody(opts: {
  model: string;
  input: InputItem[];
  includeReasoning?: boolean;
  reasoning?: { effort: ReasoningEffort };
  text?: Record<string, unknown>;
  tools?: unknown[];
}): RequestBody {
  const body: RequestBody = {
    model: opts.model,
    input: opts.input,
    store: false,
    stream: true,
  };
  if (opts.includeReasoning) body.include = ['reasoning.encrypted_content'];
  if (opts.reasoning) body.reasoning = opts.reasoning;
  if (opts.text) body.text = opts.text;
  if (opts.tools) body.tools = opts.tools;
  return body;
}

export type ResponsesEvent = { type: string; [key: string]: unknown };
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

function errorOf(error: unknown): { code: string; param?: string } {
  const e = error as { code?: unknown; param?: unknown } | null | undefined;
  return {
    code: typeof e?.code === 'string' ? e.code : '',
    param: typeof e?.param === 'string' ? e.param : undefined,
  };
}

function errorOfBody(bodyText: string): { code: string; param?: string } {
  try {
    return errorOf((JSON.parse(bodyText) as { error?: unknown }).error);
  } catch {
    return { code: '' };
  }
}

// Plan-usage errors carry their meaning in error.code, both before the stream opens and as response.failed mid-stream.
export function codeForError(
  code: string,
  status = 0,
  bodyText = '',
): ChatErrorCode {
  if (code === 'subscription_sharing_user_not_eligible')
    return 'not_eligible_plan';
  // The plan token refuses the input, tool or feature named in error.param; the caller may resend without it.
  if (code === 'subscription_sharing_unsupported_capability')
    return 'unsupported';
  if (code === 'subscription_sharing_usage_limit_exceeded' || status === 429)
    return 'rate_limited';
  if (status === 401) return 'unauthorized';
  if (
    /context_length/.test(code) ||
    /context_length_exceeded|context window|maximum context/i.test(bodyText)
  )
    return 'context_too_long';
  return 'server';
}

export async function* streamResponse(
  transport: Transport,
  body: RequestBody,
  signal: AbortSignal,
  fetchImpl: FetchLike,
): AsyncGenerator<ResponsesEvent> {
  let res: Response | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetchImpl(`${transport.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          ...(await transport.headers()),
          'content-type': 'application/json',
          accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (err) {
      if (err instanceof ResponsesError) throw err;
      throw new ResponsesError(
        signal.aborted ? 'cancelled' : 'network',
        String(err),
      );
    }
    if (
      res.status !== 401 ||
      attempt > 0 ||
      !(await transport.onUnauthorized())
    )
      break;
  }
  if (!res) throw new ResponsesError('network');
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    const { code, param } = errorOfBody(text);
    console.warn(
      `[responses] HTTP ${res.status} ${code || '-'} param ${param ?? '-'} request ${res.headers.get('x-request-id') ?? '-'}`,
    );
    throw new ResponsesError(
      codeForError(code, res.status, text),
      `HTTP ${res.status}`,
      param,
    );
  }
  try {
    for await (const msg of parseSse(
      res.body as unknown as AsyncIterable<Uint8Array>,
    )) {
      if (msg.data === '[DONE]') return;
      yield JSON.parse(msg.data) as ResponsesEvent;
    }
  } catch (err) {
    if (err instanceof ResponsesError) throw err;
    throw new ResponsesError(
      signal.aborted ? 'cancelled' : 'network',
      String(err),
    );
  }
}

export type TurnResult = { outputItems: InputItem[]; text: string };

export async function runTurn(
  events: AsyncIterable<ResponsesEvent>,
  onDelta: (text: string) => void,
): Promise<TurnResult> {
  const outputItems: InputItem[] = [];
  let text = '';
  for await (const ev of events) {
    switch (ev.type) {
      case 'response.output_text.delta': {
        const delta = String(ev.delta ?? '');
        text += delta;
        onDelta(delta);
        break;
      }
      case 'response.output_item.done':
        outputItems.push(ev.item as InputItem);
        break;
      case 'response.completed':
        return { outputItems, text };
      case 'response.failed': {
        const error = (ev.response as { error?: { message?: string } })?.error;
        const { code, param } = errorOf(error);
        console.warn(`[responses] failed ${code || '-'} param ${param ?? '-'}`);
        throw new ResponsesError(
          codeForError(code),
          error?.message ?? 'failed',
          param,
        );
      }
      case 'response.incomplete':
        throw new ResponsesError('incomplete');
      case 'error': {
        const { code, param } = errorOf(ev);
        throw new ResponsesError(
          codeForError(code),
          String(ev.message ?? code),
          param,
        );
      }
    }
  }
  throw new ResponsesError('network', 'stream ended before response.completed');
}

export function messageText(item: InputItem): string {
  const content = item.content as
    | Array<{ type: string; text?: string }>
    | undefined;
  return (content ?? [])
    .filter((c) => c.type === 'output_text' || c.type === 'input_text')
    .map((c) => c.text ?? '')
    .join('');
}
