import type { ToolCallView } from '../shared/ipc';
import type { Store } from './db';
import type { InputItem, StoredItem } from './responses';

// The plan-token docs ask for tools grouped in a namespace or sent as an additional_tools input item. A refusal that
// points at the tools moves to the next form, and the form that worked is remembered in settings.tools_mode.
export type ToolsMode = 'namespace' | 'additional_tools' | 'flat' | 'off';
const MODES: ToolsMode[] = ['namespace', 'additional_tools', 'flat', 'off'];

export const MAX_TOOL_ROUNDS = 3;
const NAMESPACE = 'experii';

const SEARCH_CARDS = {
  type: 'function',
  name: 'search_experience_cards',
  description:
    '사용자가 Experii에 남긴 경험 카드를 낱말로 찾는다. 사용자가 예전에 공부한 내용이나 자기 카드, 경험을 물을 때 쓴다. 낱말을 모두 포함한 카드를 최신순으로 5장까지 돌려준다.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          '찾을 낱말. 공백으로 나눈 낱말을 모두 포함한 카드만 나온다. 빈 문자열이면 최신 카드',
      },
    },
    required: ['query'],
    additionalProperties: false,
  },
  strict: true,
};

const LABELS = new Map([[SEARCH_CARDS.name, '내 경험 카드 검색']]);

// tools_enabled = '0' turns the tools off without forgetting which form works.
export function toolsMode(store: Store): ToolsMode {
  if (store.getSetting('tools_enabled') === '0') return 'off';
  const saved = store.getSetting('tools_mode') as ToolsMode | null;
  return saved && MODES.includes(saved) ? saved : MODES[0];
}

export function rememberToolsMode(store: Store, mode: ToolsMode) {
  if (store.getSetting('tools_enabled') === '0') return;
  if (store.getSetting('tools_mode') !== mode)
    store.setSetting('tools_mode', mode);
}

export function forgetToolsMode(store: Store) {
  store.deleteSetting('tools_mode');
}

export function nextMode(mode: ToolsMode): ToolsMode {
  return MODES[Math.min(MODES.indexOf(mode) + 1, MODES.length - 1)];
}

export function toolsFor(mode: ToolsMode): {
  tools?: unknown[];
  item?: InputItem;
} {
  switch (mode) {
    case 'namespace':
      return {
        tools: [
          {
            type: 'namespace',
            name: NAMESPACE,
            description: 'Experii 앱 안 도구',
            tools: [SEARCH_CARDS],
          },
        ],
      };
    case 'additional_tools':
      return {
        item: {
          type: 'additional_tools',
          role: 'developer',
          tools: [SEARCH_CARDS],
        },
      };
    case 'flat':
      return { tools: [SEARCH_CARDS] };
    case 'off':
      return {};
  }
}

// A saved call names the namespace only while the tools go out in one, so history survives a change of form.
export function fitCall(item: InputItem, mode: ToolsMode): InputItem {
  if (item.type !== 'function_call') return item;
  const { namespace: _namespace, ...rest } = item;
  return mode === 'namespace' && LABELS.has(String(item.name))
    ? { ...rest, namespace: NAMESPACE }
    : rest;
}

export function pointsAtTools(
  param: string | undefined,
  input: InputItem[],
): boolean {
  if (!param) return false;
  if (/^tools\b/.test(param)) return true;
  const m = /^input\[(\d+)\](.*)$/.exec(param);
  if (!m) return false;
  const item = input[Number(m[1])];
  return (
    item?.type === 'additional_tools' ||
    (item?.type === 'function_call' && m[2].startsWith('.namespace'))
  );
}

function queryOf(args: unknown): string | null {
  try {
    const { query } = JSON.parse(String(args)) as { query?: unknown };
    return typeof query === 'string' ? query : null;
  } catch {
    return null;
  }
}

export type ToolCall = {
  callId: string;
  name: string;
  label: string;
  query: string;
};

export function describeCall(item: InputItem): ToolCall {
  const name = String(item.name ?? '');
  return {
    callId: String(item.call_id ?? ''),
    name,
    label: LABELS.get(name) ?? name,
    query: queryOf(item.arguments) ?? '',
  };
}

// The output goes back to GPT as it is; count is null when the call could not run.
export function runTool(
  store: Store,
  item: InputItem,
): { output: string; count: number | null } {
  const ours =
    item.name === SEARCH_CARDS.name &&
    (item.namespace === undefined || item.namespace === NAMESPACE);
  const query = queryOf(item.arguments);
  if (!ours || query === null)
    return {
      output: JSON.stringify({
        error: ours ? 'invalid_arguments' : 'unknown_tool',
      }),
      count: null,
    };
  const result = store.searchCards(query);
  return { output: JSON.stringify(result), count: result.total };
}

// Where each saved call sat among the visible messages, so a reopened conversation can show it again.
export function toolCallsOf(items: StoredItem[]): ToolCallView[] {
  const rows = [...items]
    .sort((a, b) => a.seq - b.seq)
    .map((r) => JSON.parse(r.item_json) as InputItem);
  const counts = new Map<string, number | null>();
  for (const item of rows) {
    if (item.type !== 'function_call_output') continue;
    try {
      const { total } = JSON.parse(String(item.output)) as { total?: unknown };
      counts.set(
        String(item.call_id),
        typeof total === 'number' ? total : null,
      );
    } catch {
      counts.set(String(item.call_id), null);
    }
  }
  const calls: ToolCallView[] = [];
  let messages = 0;
  for (const item of rows) {
    if (
      item.type === 'message' &&
      (item.role === 'user' || item.role === 'assistant')
    )
      messages++;
    if (item.type !== 'function_call') continue;
    const { callId, name, label, query } = describeCall(item);
    calls.push({
      afterMessage: messages - 1,
      name,
      label,
      query,
      count: counts.get(callId) ?? null,
    });
  }
  return calls;
}
