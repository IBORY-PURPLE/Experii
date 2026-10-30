import type { StoredCard } from './card';
import type {
  AuthStatus,
  CardEvent,
  CardResult,
  ChatEvent,
  ConversationView,
  Result,
  Roadmap,
  SignOutResult,
  Subject,
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
  openUsage(): Promise<Result<null>>;
  onChatEvent(listener: (event: ChatEvent) => void): () => void;
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
  'send',
  'cancel',
  'generateCard',
  'cancelCard',
  'getCard',
  'rateCard',
  'openUsage',
  'onChatEvent',
  'onCardEvent',
  'onAuthChanged',
];
