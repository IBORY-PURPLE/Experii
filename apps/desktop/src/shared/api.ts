import type { StoredCard } from './card';
import type {
  AuthStatus,
  CardEvent,
  CardResult,
  ChatEvent,
  ConversationView,
  ModelList,
  Note,
  NoteCreated,
  NoteDraft,
  NotePatch,
  Result,
  Roadmap,
  SignOutResult,
  Subject,
  ToolEvent,
} from './ipc';

export type ExperiiApi = {
  authStatus(): Promise<Result<AuthStatus>>;
  signIn(newAccount?: boolean): Promise<Result<AuthStatus>>;
  signOut(): Promise<Result<SignOutResult>>;
  listSubjects(): Promise<Result<Subject[]>>;
  createSubject(title: string): Promise<Result<Subject>>;
  getRoadmap(subjectId: string): Promise<Result<Roadmap>>;
  openConversation(
    subjectId: string,
    recommendedNodeId?: string,
  ): Promise<Result<ConversationView>>;
  getConversation(id: string): Promise<Result<ConversationView>>;
  listModels(): Promise<Result<ModelList>>;
  setConversationModel(id: string, model: string): Promise<Result<null>>;
  send(
    conversationId: string,
    streamId: string,
    text: string,
  ): Promise<Result<null>>;
  cancel(streamId: string): Promise<Result<null>>;
  generateCard(conversationId: string): Promise<Result<CardResult>>;
  cancelCard(conversationId: string): Promise<Result<null>>;
  getCard(id: string): Promise<Result<StoredCard>>;
  rateCard(id: string, useful: boolean): Promise<Result<null>>;
  listNotes(conversationId: string): Promise<Result<Note[]>>;
  createNote(draft: NoteDraft): Promise<Result<NoteCreated>>;
  updateNote(id: string, patch: NotePatch): Promise<Result<Note>>;
  deleteNote(id: string): Promise<Result<Note>>;
  openUsage(): Promise<Result<null>>;
  onChatEvent(listener: (event: ChatEvent) => void): () => void;
  onToolEvent(listener: (event: ToolEvent) => void): () => void;
  onCardEvent(listener: (event: CardEvent) => void): () => void;
  onAuthChanged(listener: () => void): () => void;
};

export const API_KEYS: Array<keyof ExperiiApi> = [
  'authStatus',
  'signIn',
  'signOut',
  'listSubjects',
  'createSubject',
  'getRoadmap',
  'openConversation',
  'getConversation',
  'listModels',
  'setConversationModel',
  'send',
  'cancel',
  'generateCard',
  'cancelCard',
  'getCard',
  'rateCard',
  'listNotes',
  'createNote',
  'updateNote',
  'deleteNote',
  'openUsage',
  'onChatEvent',
  'onToolEvent',
  'onCardEvent',
  'onAuthChanged',
];
