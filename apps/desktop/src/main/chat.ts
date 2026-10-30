import { randomUUID } from 'node:crypto';
import type { ChatEvent, ConversationView } from '../shared/ipc';
import { appContext } from './context';
import type { NewConversation, Store } from './db';
import { IpcError, type StreamRegistry } from './ipc';
import {
  ResponsesError,
  buildInput,
  buildRequestBody,
  developerMessage,
  runTurn,
  streamResponse,
  userMessage,
  type FetchLike,
  type Transport,
} from './responses';

export type ModelSource = {
  transport(): Promise<Transport>;
  resolveModel(transport: Transport): Promise<string>;
  modelName?(slug: string): string;
};

const NEW_TITLE = '새 대화';
const titleFrom = (text: string) => {
  const line = text.trim().split('\n')[0];
  return line.length > 30 ? `${line.slice(0, 30)}…` : line;
};

export function draftFor(node: { title: string; reason: string }) {
  return `"${node.title}"을(를) 이어서 공부하고 싶어요. ${node.reason}`;
}

// A conversation gets its database row with its first saved turn; until then it lives here.
export class ChatService {
  private pending = new Map<string, NewConversation & { draft?: string }>();

  constructor(
    private store: Store,
    private models: ModelSource,
    private streams: StreamRegistry,
    private fetchImpl: FetchLike,
  ) {}

  open(subjectId: string, recommendedNodeId?: string): ConversationView {
    if (!this.store.getSubject(subjectId)) throw new IpcError('not_found');
    let draft: string | undefined;
    if (recommendedNodeId) {
      const node = this.store.getRecommendedNode(recommendedNodeId);
      if (!node || node.subjectId !== subjectId)
        throw new IpcError('not_found');
      draft = draftFor(node);
    }
    const id = randomUUID();
    this.pending.set(id, {
      id,
      subjectId,
      fromRecommendedNodeId: recommendedNodeId ?? null,
      model: '',
      title: NEW_TITLE,
      draft,
    });
    return {
      id,
      subjectId,
      title: NEW_TITLE,
      messages: [],
      cardId: null,
      saved: false,
      draft,
    };
  }

  get(id: string): ConversationView {
    const row = this.store.getConversationRow(id);
    if (row) {
      return {
        id,
        subjectId: row.subjectId,
        title: row.title,
        messages: this.store.messages(id),
        cardId: this.store.cardIdForConversation(id),
        saved: true,
      };
    }
    const p = this.pending.get(id);
    if (!p) throw new IpcError('not_found');
    return {
      id,
      subjectId: p.subjectId,
      title: p.title,
      messages: [],
      cardId: null,
      saved: false,
      draft: p.draft,
    };
  }

  send(
    conversationId: string,
    streamId: string,
    text: string,
    emit: (event: ChatEvent) => void,
  ) {
    const row = this.store.getConversationRow(conversationId);
    const pending = this.pending.get(conversationId);
    const conv = row ?? pending;
    if (!conv) throw new IpcError('not_found');
    const controller = this.streams.start(conversationId, streamId);
    const base = { streamId, conversationId };
    void (async () => {
      try {
        const transport = await this.models.transport();
        const model = conv.model || (await this.models.resolveModel(transport));
        const context = appContext({
          subject: this.store.getSubject(conv.subjectId)?.title ?? '',
          model,
          modelName: this.models.modelName?.(model) ?? model,
          toolsOn: false,
        });
        const body = buildRequestBody({
          model,
          input: [
            developerMessage(context),
            ...buildInput(this.store.items(conversationId), text),
          ],
        });
        const result = await runTurn(
          streamResponse(transport, body, controller.signal, this.fetchImpl),
          (delta) => emit({ ...base, type: 'delta', text: delta }),
        );
        if (controller.signal.aborted) throw new ResponsesError('cancelled');
        this.store.saveTurn(
          row ?? { ...pending!, model, title: titleFrom(text) },
          userMessage(text),
          result.outputItems,
        );
        this.pending.delete(conversationId);
        emit({ ...base, type: 'done' });
      } catch (err) {
        const code =
          err instanceof ResponsesError
            ? err.code
            : controller.signal.aborted
              ? 'cancelled'
              : 'server';
        if (!(err instanceof ResponsesError))
          console.error(
            '[chat] turn failed:',
            err instanceof Error ? err.name : 'error',
          );
        emit({ ...base, type: 'error', code });
      } finally {
        this.streams.finish(streamId);
      }
    })();
  }
}
