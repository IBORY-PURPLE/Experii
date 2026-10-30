import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ExperiiApi } from './shared/api';
import type { CardEvent, ChatEvent, ToolEvent } from './shared/ipc';

const invoke = (channel: string, payload?: unknown) =>
  ipcRenderer.invoke(channel, payload);

const subscribe = <T>(channel: string, listener: (value: T) => void) => {
  const wrapped = (_event: IpcRendererEvent, value: T) => listener(value);
  ipcRenderer.on(channel, wrapped);
  return () => {
    ipcRenderer.removeListener(channel, wrapped);
  };
};

const api: ExperiiApi = {
  authStatus: () => invoke('auth:status'),
  signIn: (newAccount) =>
    invoke('auth:signIn', newAccount ? { newAccount } : undefined),
  signOut: () => invoke('auth:signOut'),
  listSubjects: () => invoke('subjects:list'),
  createSubject: (title) => invoke('subjects:create', { title }),
  getRoadmap: (subjectId) => invoke('roadmap:get', { subjectId }),
  openConversation: (subjectId, recommendedNodeId) =>
    invoke('conversations:open', { subjectId, recommendedNodeId }),
  getConversation: (id) => invoke('conversations:get', { id }),
  listModels: () => invoke('models:list'),
  setConversationModel: (id, model) =>
    invoke('conversations:setModel', { id, model }),
  send: (conversationId, streamId, text) =>
    invoke('chat:send', { conversationId, streamId, text }),
  cancel: (streamId) => invoke('chat:cancel', { streamId }),
  generateCard: (conversationId) =>
    invoke('cards:generate', { conversationId }),
  cancelCard: (conversationId) => invoke('cards:cancel', { conversationId }),
  getCard: (id) => invoke('cards:get', { id }),
  rateCard: (id, useful) => invoke('cards:rate', { id, useful }),
  listNotes: (conversationId) => invoke('notes:list', { conversationId }),
  createNote: (draft) => invoke('notes:create', draft),
  updateNote: (id, patch) => invoke('notes:update', { ...patch, id }),
  deleteNote: (id) => invoke('notes:delete', { id }),
  openUsage: () => invoke('links:openUsage'),
  onChatEvent: (listener) => subscribe<ChatEvent>('chat:event', listener),
  onToolEvent: (listener) => subscribe<ToolEvent>('chat:tool', listener),
  onCardEvent: (listener) => subscribe<CardEvent>('cards:event', listener),
  onAuthChanged: (listener) => subscribe<void>('auth:changed', listener),
};

contextBridge.exposeInMainWorld('experii', api);
