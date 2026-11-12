import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { CAPTURE_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, captureUserText } from './prompt';
import {
  AdapterError,
  CaptureNotesSchema,
  type CaptureInput,
  type CaptureNotesResult,
  type ChatTurn,
  type ClaudeAdapter,
} from './types';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

// Server-side refusal fallback is offered on the 5.x family; older models run without it.
const supportsFallback = (model: string) => /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model);

// The API wants turns that alternate and open with the user: a question left without an answer joins the next one.
export function alternate(turns: ChatTurn[]): ChatTurn[] {
  const out: ChatTurn[] = [];
  for (const turn of turns) {
    if (!turn.content.trim()) continue;
    if (out.length === 0 && turn.role !== 'user') continue;
    const last = out[out.length - 1];
    if (last && last.role === turn.role) last.content = `${last.content}\n\n${turn.content}`;
    else out.push({ ...turn });
  }
  return out;
}

function mapError(error: unknown): never {
  if (error instanceof AdapterError) throw error;
  // these two are APIError subclasses too, so they come first
  if (error instanceof Anthropic.APIUserAbortError || error instanceof Anthropic.APIConnectionTimeoutError)
    throw new AdapterError('upstream', '시간이 너무 오래 걸렸어요.');
  if (error instanceof Anthropic.RateLimitError)
    throw new AdapterError('rate_limited', 'Claude 사용량 한도에 걸렸어요. 잠시 뒤 다시 시도해 주세요.');
  if (error instanceof Anthropic.APIError)
    throw new AdapterError('upstream', `Claude API 오류 (${error.status ?? '연결'})`);
  throw error;
}

type Block = { type: string; text?: string };

// The notes are the text after the last fallback block (when a fallback model took over, what came before it was
// the declined attempt). The stop reason is read before this, so a refusal or a cut-off answer never gets here.
export function readNotes(content: Block[]): CaptureNotesResult {
  let start = 0;
  content.forEach((block, i) => {
    if (block.type === 'fallback') start = i + 1;
  });
  const text = content
    .slice(start)
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new AdapterError('invalid_output', 'Claude 응답을 필기로 읽지 못했어요.');
  }
  const parsed = CaptureNotesSchema.safeParse(json);
  if (!parsed.success) throw new AdapterError('invalid_output', 'Claude 응답을 필기로 읽지 못했어요.');
  return parsed.data;
}

// The live adapter. lib/claude/index.ts builds it only when CLAUDE_ADAPTER=anthropic and ANTHROPIC_API_KEY are set.
export function createAnthropicAdapter(opts: {
  apiKey: string;
  model: string;
  effort?: Effort;
  // tests only: answers requests without the network
  fetch?: typeof globalThis.fetch;
}): ClaudeAdapter {
  const client = new Anthropic({
    apiKey: opts.apiKey,
    maxRetries: 1,
    timeout: 55_000,
    ...(opts.fetch ? { fetch: opts.fetch } : {}),
  });
  const model = opts.model;
  const effort = opts.effort ? { effort: opts.effort } : {};
  const fallback = supportsFallback(model)
    ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
    : {};

  return {
    name: 'anthropic',
    model,
    async generateNotesFromCapture(
      input: CaptureInput,
      signal?: AbortSignal,
    ): Promise<CaptureNotesResult> {
      try {
        // create, not parse: parse throws on a refusal or a cut-off answer before its stop reason can be read
        const response = await client.beta.messages.create(
          {
            model,
            max_tokens: 16000,
            system: CAPTURE_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: input.mediaType,
                      data: Buffer.from(input.data).toString('base64'),
                    },
                  },
                  { type: 'text', text: captureUserText(input.topic) },
                ],
              },
            ],
            output_config: { ...effort, format: betaZodOutputFormat(CaptureNotesSchema) },
            ...fallback,
          },
          // one try only: the route's deadline leaves no room for a second
          { signal, maxRetries: 0 },
        );
        if (response.stop_reason === 'refusal')
          throw new AdapterError('refused', 'Claude가 이 이미지로 필기를 만들지 않았어요.');
        if (response.stop_reason === 'max_tokens')
          throw new AdapterError('invalid_output', '필기가 너무 길어서 끝까지 받지 못했어요.');
        return readNotes(response.content as Block[]);
      } catch (error) {
        mapError(error);
      }
    },
    async *streamChat(turns: ChatTurn[], signal?: AbortSignal) {
      try {
        const stream = client.messages.stream(
          {
            model,
            max_tokens: 4000,
            system: CHAT_SYSTEM_PROMPT,
            // the conversation so far is sent again with every question; caching makes the repeat cheap
            cache_control: { type: 'ephemeral' },
            messages: alternate(turns).map((t) => ({ role: t.role, content: t.content })),
            ...(opts.effort ? { output_config: { effort: opts.effort } } : {}),
          },
          { signal },
        );
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta')
            yield event.delta.text;
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === 'refusal') yield '\n\n_(이 질문에는 답하지 않았어요.)_';
      } catch (error) {
        mapError(error);
      }
    },
  };
}
