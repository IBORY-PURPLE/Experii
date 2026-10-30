import type { IpcMainInvokeEvent } from 'electron';
import {
  channels,
  type Channel,
  type Payload,
  type Result,
} from '../shared/ipc';

export class IpcError extends Error {
  constructor(
    readonly code: string,
    message = code,
  ) {
    super(message);
  }
}

export type Handler<C extends Channel> = (
  payload: Payload<C>,
  event: IpcMainInvokeEvent,
) => unknown | Promise<unknown>;

// Every channel rejects untrusted senders and payloads that fail its schema before the handler runs.
export function guard<C extends Channel>(
  channel: C,
  isTrusted: (event: IpcMainInvokeEvent) => boolean,
  handler: Handler<C>,
) {
  return async (
    event: IpcMainInvokeEvent,
    raw: unknown,
  ): Promise<Result<unknown>> => {
    if (!isTrusted(event)) return { ok: false, code: 'forbidden' };
    const parsed = channels[channel].safeParse(raw);
    if (!parsed.success) return { ok: false, code: 'invalid_payload' };
    try {
      return {
        ok: true,
        data: await handler(parsed.data as Payload<C>, event),
      };
    } catch (err) {
      if (err instanceof IpcError)
        return { ok: false, code: err.code, message: err.message };
      console.error(
        `[ipc] ${channel} failed:`,
        err instanceof Error ? err.name : 'error',
      );
      return { ok: false, code: 'internal' };
    }
  };
}

// One stream per conversation: a second send while one is running is refused, not queued.
export class StreamRegistry {
  private byStream = new Map<
    string,
    { conversationId: string; controller: AbortController }
  >();

  start(conversationId: string, streamId: string): AbortController {
    for (const s of this.byStream.values()) {
      if (s.conversationId === conversationId) throw new IpcError('busy');
    }
    const controller = new AbortController();
    this.byStream.set(streamId, { conversationId, controller });
    return controller;
  }

  finish(streamId: string) {
    this.byStream.delete(streamId);
  }

  cancel(streamId: string) {
    this.byStream.get(streamId)?.controller.abort();
  }

  cancelAll() {
    for (const s of this.byStream.values()) s.controller.abort();
  }

  isActive(conversationId: string) {
    return [...this.byStream.values()].some(
      (s) => s.conversationId === conversationId,
    );
  }
}
