import { z } from 'zod';
import type { Redactions } from './card';

export type Subject = {
  id: string;
  title: string;
  cardCount: number;
  createdAt: number;
};

export type DoneNode = {
  kind: 'done';
  conversationId: string;
  cardId: string;
  title: string;
  summary: string;
  interviewLine: string;
  useful: boolean | null;
  createdAt: number;
};
export type CurrentNode = {
  kind: 'current';
  conversationId: string;
  title: string;
  turns: number;
  createdAt: number;
};
export type LockedNode = {
  kind: 'locked';
  id: string;
  title: string;
  reason: string;
};
export type RoadmapNode = DoneNode | CurrentNode | LockedNode;

export type RoadmapStats = {
  cards: number;
  useful: number;
  rated: number;
  unrated: number;
};
export type Roadmap = {
  subject: Subject;
  stats: RoadmapStats;
  nodes: RoadmapNode[];
};

export type ChatMessage = { role: 'user' | 'assistant'; text: string };
export type ConversationView = {
  id: string;
  subjectId: string;
  title: string;
  messages: ChatMessage[];
  cardId: string | null;
  saved: boolean;
  draft?: string;
  // null until the conversation or the new-conversation default names one; models:list has the current default.
  model: string | null;
  toolCalls: ToolCallView[];
};

// afterMessage is the index in messages of the message the call came after; count is null when the call failed.
export type ToolCallView = {
  afterMessage: number;
  name: string;
  label: string;
  query: string;
  count: number | null;
};

export type ModelOption = { slug: string; displayName: string };
export type ModelList = { models: ModelOption[]; current: string | null };

export type AuthStatus =
  | { state: 'signed_out' }
  | {
      state: 'signed_in';
      email: string | null;
      plan: 'chatgpt-plan' | 'experii';
    };

export type SignOutResult = { revoked: boolean };

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message?: string };

export type CardResult =
  | { kind: 'card'; cardId: string; redactions: Redactions }
  | { kind: 'no_learning' }
  | { kind: 'invalid' }
  | { kind: 'too_long' };

const id = z.string().uuid();

export const channels = {
  'auth:status': z.undefined(),
  'auth:signIn': z.object({ newAccount: z.boolean() }).optional(),
  'auth:signOut': z.undefined(),
  'subjects:list': z.undefined(),
  'subjects:create': z.object({ title: z.string().trim().min(1).max(40) }),
  'roadmap:get': z.object({ subjectId: id }),
  'conversations:open': z.object({
    subjectId: id,
    recommendedNodeId: id.optional(),
  }),
  'conversations:get': z.object({ id }),
  'conversations:setModel': z.object({
    id,
    model: z.string().trim().min(1).max(80),
  }),
  'models:list': z.undefined(),
  'chat:send': z.object({
    conversationId: id,
    streamId: id,
    text: z.string().trim().min(1).max(20000),
  }),
  'chat:cancel': z.object({ streamId: id }),
  'cards:generate': z.object({ conversationId: id }),
  'cards:cancel': z.object({ conversationId: id }),
  'cards:get': z.object({ id }),
  'cards:rate': z.object({ id, useful: z.boolean() }),
  'links:openUsage': z.undefined(),
} as const;

export type Channel = keyof typeof channels;
export type Payload<C extends Channel> = z.infer<(typeof channels)[C]>;

export type ChatEvent = {
  streamId: string;
  conversationId: string;
  type: 'delta' | 'done' | 'error';
  text?: string;
  code?: string;
};

// A tool call during a stream, sent on its own channel so chat:event keeps its three types.
export type ToolEvent = {
  streamId: string;
  conversationId: string;
  callId: string;
  name: string;
  label: string;
  query: string;
  status: 'running' | 'done' | 'error';
  count?: number;
};

export const EVENT_CHAT = 'chat:event';
export const EVENT_TOOL = 'chat:tool';
export const EVENT_AUTH = 'auth:changed';
