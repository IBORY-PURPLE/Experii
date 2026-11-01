import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import {
  EVENT_CARD,
  EVENT_CHAT,
  EVENT_TOOL,
  type Channel,
} from '../shared/ipc';
import { AuthError } from './auth';
import type { CardService } from './cards';
import type { ChatService } from './chat';
import { DuplicateSubjectError, type Store } from './db';
import { IpcError, guard, type Handler, type StreamRegistry } from './ipc';
import type { Session } from './session';

export const USAGE_URL = 'https://chatgpt.com/settings/usage';

export type Deps = {
  store: Store;
  session: Session;
  chat: ChatService;
  cards: CardService;
  streams: StreamRegistry;
  isTrusted: (event: IpcMainInvokeEvent) => boolean;
  openExternal: (url: string) => Promise<void>;
};

export function registerHandlers(deps: Deps) {
  const { store, session, chat, cards, streams, isTrusted } = deps;
  const on = <C extends Channel>(channel: C, handler: Handler<C>) =>
    ipcMain.handle(channel, guard(channel, isTrusted, handler));

  on('auth:status', () => session.status());
  on('auth:signIn', async (payload) => {
    try {
      return await session.signIn(payload?.newAccount ?? false);
    } catch (err) {
      if (err instanceof AuthError) throw new IpcError(err.code);
      throw err;
    }
  });
  on('auth:signOut', async () => {
    session.cancelSignIn();
    streams.cancelAll();
    return session.signOut();
  });

  on('subjects:list', () => store.listSubjects());
  on('subjects:create', ({ title }) => {
    try {
      return store.createSubject(title);
    } catch (err) {
      if (err instanceof DuplicateSubjectError)
        throw new IpcError('duplicate', '이미 있는 과목이에요');
      throw err;
    }
  });
  on('roadmap:get', ({ subjectId }) => {
    const roadmap = store.roadmap(subjectId);
    if (!roadmap) throw new IpcError('not_found');
    return roadmap;
  });

  on('conversations:open', ({ subjectId, recommendedNodeId }) =>
    chat.open(subjectId, recommendedNodeId),
  );
  on('conversations:get', ({ id }) => chat.get(id));
  on('conversations:setModel', ({ id, model }) => {
    chat.setModel(id, model);
    return null;
  });
  on('models:list', () => session.listModels());
  on('chat:send', ({ conversationId, streamId, text }, event) => {
    const sender = event.sender;
    chat.send(
      conversationId,
      streamId,
      text,
      (ev) => {
        if (!sender.isDestroyed()) sender.send(EVENT_CHAT, ev);
      },
      (ev) => {
        if (!sender.isDestroyed()) sender.send(EVENT_TOOL, ev);
      },
    );
    return null;
  });
  on('chat:cancel', ({ streamId }) => {
    streams.cancel(streamId);
    return null;
  });

  on('cards:generate', ({ conversationId }, event) => {
    const sender = event.sender;
    return cards.generate(conversationId, (ev) => {
      if (!sender.isDestroyed()) sender.send(EVENT_CARD, ev);
    });
  });
  on('cards:cancel', ({ conversationId }) => {
    cards.cancel(conversationId);
    return null;
  });
  on('cards:get', ({ id }) => {
    const card = store.getCard(id);
    if (!card) throw new IpcError('not_found');
    return card;
  });
  on('cards:rate', ({ id, useful }) => {
    if (!store.getCard(id)) throw new IpcError('not_found');
    store.rateCard(id, useful);
    return null;
  });

  on('links:openUsage', async () => {
    await deps.openExternal(USAGE_URL);
    return null;
  });
}
