import { after } from 'next/server';
import { getAdapter } from '@/lib/claude';
import type { ChatTurn } from '@/lib/claude/types';
import { HttpError, fail, readJson, requireId, requireVisitor } from '@/lib/server/http';
import { chatLimit } from '@/lib/server/limits';
import { addMessage, assertPage, chatHistory, takeChat, touchPage } from '@/lib/server/store';
import { DEFAULT_TITLE, MAX_MESSAGE_CHARS } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

type Ctx = { params: Promise<{ id: string }> };

const titleFrom = (text: string) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > 30 ? `${flat.slice(0, 30)}…` : flat;
};

// The answer streams as plain text. The question is saved first and the answer once it ends, also when the reader
// stops it halfway, so a reload shows what was on screen.
export async function POST(request: Request, { params }: Ctx) {
  try {
    const visitor = await requireVisitor();
    const id = requireId((await params).id);
    const body = await readJson<{ text?: unknown }>(request);
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    if (!text) throw new HttpError(400, 'empty_message');
    if (text.length > MAX_MESSAGE_CHARS) throw new HttpError(400, 'message_too_long');
    const page = await assertPage(visitor, id);
    await takeChat(visitor, chatLimit());

    const history = await chatHistory(visitor, id);
    const question = await addMessage(visitor, id, 'user', text);
    await touchPage(visitor, id, page.title === DEFAULT_TITLE ? titleFrom(text) : undefined);

    const adapter = getAdapter();
    const turns: ChatTurn[] = [...history, { role: 'user', content: text }];
    const encoder = new TextEncoder();
    let answer = '';
    let finished!: () => void;
    // keeps the function alive until the answer is saved, also when the reader stopped it halfway
    after(new Promise<void>((resolve) => (finished = resolve)));

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of adapter.streamChat(turns, request.signal)) {
            answer += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          if (!request.signal.aborted) {
            console.error('chat stream', error);
            const note = '\n\n_(답을 받다가 끊겼어요. 다시 보내 주세요.)_';
            answer += note;
            try {
              controller.enqueue(encoder.encode(note));
            } catch {
              // the reader is gone
            }
          }
        } finally {
          try {
            controller.close();
          } catch {
            // already closed by a cancelled reader
          }
          if (answer.trim()) await addMessage(visitor, id, 'assistant', answer).catch(console.error);
          finished();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
        'x-question-seq': String(question.seq),
        'x-adapter': adapter.name,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
