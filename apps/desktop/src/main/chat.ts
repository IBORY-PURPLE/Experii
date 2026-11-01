import { randomUUID } from 'node:crypto';
import type { ChatEvent, ConversationView, ToolEvent } from '../shared/ipc';
import { appContext } from './context';
import type { NewConversation, Store } from './db';
import { IpcError, type StreamRegistry } from './ipc';
import {
  ResponsesError,
  buildInput,
  buildRequestBody,
  developerMessage,
  runTurn,
  sendable,
  streamResponse,
  tagModel,
  userMessage,
  type FetchLike,
  type InputItem,
  type Transport,
  type TurnResult,
} from './responses';
import {
  MAX_TOOL_ROUNDS,
  describeCall,
  fitCall,
  nextMode,
  pointsAtTools,
  rememberToolsMode,
  runTool,
  toolCallsOf,
  toolsFor,
  toolsMode,
} from './tools';

export type ModelSource = {
  transport(): Promise<Transport>;
  resolveModel(transport: Transport): Promise<string>;
  modelName?(slug: string): string;
};

type Answering = {
  transport: Transport;
  model: string;
  subject: string;
  history: InputItem[];
  signal: AbortSignal;
  onDelta: (text: string) => void;
  onTool: (call: Omit<ToolEvent, 'streamId' | 'conversationId'>) => void;
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
    return this.get(id);
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
        model: row.model,
        toolCalls: toolCallsOf(this.store.items(id)),
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
      model: p.model || this.store.getSetting('default_model'),
      toolCalls: [],
    };
  }

  isPending(id: string): boolean {
    return this.pending.has(id);
  }

  // The next send uses the model, and it becomes the default for new conversations.
  setModel(id: string, model: string) {
    const pending = this.pending.get(id);
    if (this.store.getConversationRow(id))
      this.store.setConversationModel(id, model);
    else if (pending) pending.model = model;
    else throw new IpcError('not_found');
    this.store.setSetting('default_model', model);
  }

  send(
    conversationId: string,
    streamId: string,
    text: string,
    emit: (event: ChatEvent) => void,
    emitTool: (event: ToolEvent) => void = () => {},
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
        const user = userMessage(text);
        const turn = await this.answer({
          transport,
          model,
          subject: this.store.getSubject(conv.subjectId)?.title ?? '',
          history: [
            ...buildInput(this.store.items(conversationId), undefined, model),
            user,
          ],
          signal: controller.signal,
          onDelta: (delta) => emit({ ...base, type: 'delta', text: delta }),
          onTool: (call) => emitTool({ ...base, ...call }),
        });
        if (controller.signal.aborted) throw new ResponsesError('cancelled');
        // A model picked while the first answer streamed is the one the new conversation keeps.
        this.store.saveTurn(
          row ?? {
            ...pending!,
            model: pending!.model || model,
            title: titleFrom(text),
          },
          user,
          turn,
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

  // One answer may take several requests: each round's tool calls run here and their outputs go into the next one.
  // The rounds come back together, so the turn is saved whole or not at all.
  private async answer(opts: Answering): Promise<InputItem[]> {
    const turn: InputItem[] = [];
    let shown = false;
    for (let round = 0; ; round++) {
      let first = true;
      const result = await this.request(
        opts,
        [
          ...opts.history,
          ...turn.flatMap((item) => sendable(item, opts.model) ?? []),
        ],
        (delta) => {
          if (first && shown) opts.onDelta('\n\n');
          first = false;
          shown = true;
          opts.onDelta(delta);
        },
      );
      const items = result.outputItems.map((item) =>
        tagModel(item, opts.model),
      );
      turn.push(...items);
      const calls = items.filter((item) => item.type === 'function_call');
      if (calls.length === 0) return turn;
      if (round === MAX_TOOL_ROUNDS) throw new ResponsesError('tool_limit');
      for (const call of calls) {
        const info = describeCall(call);
        opts.onTool({ ...info, status: 'running' });
        let ran: { output: string; count: number | null };
        try {
          ran = runTool(this.store, call);
        } catch (err) {
          console.error(
            '[chat] tool failed:',
            err instanceof Error ? err.name : 'error',
          );
          ran = {
            output: JSON.stringify({ error: 'tool_failed' }),
            count: null,
          };
        }
        turn.push({
          type: 'function_call_output',
          call_id: info.callId,
          output: ran.output,
        });
        opts.onTool(
          ran.count === null
            ? { ...info, status: 'error' }
            : { ...info, status: 'done', count: ran.count },
        );
      }
    }
  }

  // A refusal that points at the tools arrives before the stream opens, so the next form goes out at once.
  private async request(
    opts: Answering,
    items: InputItem[],
    onDelta: (text: string) => void,
  ): Promise<TurnResult> {
    let mode = toolsMode(this.store);
    for (;;) {
      const { tools, item } = toolsFor(mode);
      const context = appContext({
        subject: opts.subject,
        model: opts.model,
        modelName: this.models.modelName?.(opts.model) ?? opts.model,
        toolsOn: mode !== 'off',
      });
      const input = [
        developerMessage(context),
        ...(item ? [item] : []),
        ...items.map((i) => fitCall(i, mode)),
      ];
      let streamed = false;
      try {
        const result = await runTurn(
          streamResponse(
            opts.transport,
            buildRequestBody({ model: opts.model, input, tools }),
            opts.signal,
            this.fetchImpl,
          ),
          (delta) => {
            streamed = true;
            onDelta(delta);
          },
        );
        rememberToolsMode(this.store, mode);
        return result;
      } catch (err) {
        if (
          streamed ||
          mode === 'off' ||
          !(err instanceof ResponsesError) ||
          (err.code !== 'unsupported' && err.code !== 'server') ||
          !pointsAtTools(err.param, input)
        )
          throw err;
        console.warn(`[chat] tools refused as ${mode}: ${err.param}`);
        mode = nextMode(mode);
      }
    }
  }
}
