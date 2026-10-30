import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { ExperiiApi } from './shared/api';
import type { ChatEvent } from './shared/ipc';

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
  openUsage: () => invoke('links:openUsage'),
  onChatEvent: (listener) => subscribe<ChatEvent>('chat:event', listener),
  onAuthChanged: (listener) => subscribe<void>('auth:changed', listener),
};

contextBridge.exposeInMainWorld('experii', api);
