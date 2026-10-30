import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Store } from '../../src/main/db';
import type { InputItem } from '../../src/main/responses';
import {
  fitCall,
  forgetToolsMode,
  nextMode,
  pointsAtTools,
  rememberToolsMode,
  runTool,
  toolCallsOf,
  toolsFor,
  toolsMode,
} from '../../src/main/tools';

let dir: string;
let store: Store;

beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), 'experii-tools-'));
  store = new Store(path.join(dir, 'experii.db'));
});
afterEach(() => {
  store.close();
  rmSync(dir, { recursive: true, force: true });
});

const call = (over: Record<string, unknown> = {}): InputItem => ({
  type: 'function_call',
  call_id: 'call_1',
  name: 'search_experience_cards',
  arguments: '{"query":"JOIN"}',
  ...over,
});

describe('tool forms', () => {
  it('sends the search tool in a namespace, as an additional_tools item, flat, or not at all', () => {
    const ns = toolsFor('namespace');
    expect(ns.item).toBeUndefined();
    expect(ns.tools).toMatchObject([
      {
        type: 'namespace',
        name: 'experii',
        tools: [{ type: 'function', name: 'search_experience_cards' }],
      },
    ]);
    expect(toolsFor('additional_tools')).toMatchObject({
      item: {
        type: 'additional_tools',
        role: 'developer',
        tools: [{ name: 'search_experience_cards' }],
      },
    });
    expect(toolsFor('flat').tools).toMatchObject([
      {
        type: 'function',
        name: 'search_experience_cards',
        strict: true,
        parameters: {
          required: ['query'],
          additionalProperties: false,
        },
      },
    ]);
    expect(toolsFor('off')).toEqual({});
    expect(
      ['namespace', 'additional_tools', 'flat', 'off'].map((m) =>
        nextMode(m as never),
      ),
    ).toEqual(['additional_tools', 'flat', 'off', 'off']);
  });

  it('remembers the form that worked unless tools are switched off', () => {
    expect(toolsMode(store)).toBe('namespace');
    rememberToolsMode(store, 'flat');
    expect(toolsMode(store)).toBe('flat');
    store.setSetting('tools_enabled', '0');
    expect(toolsMode(store)).toBe('off');
    rememberToolsMode(store, 'off');
    expect(store.getSetting('tools_mode')).toBe('flat');
    store.deleteSetting('tools_enabled');
    store.setSetting('tools_mode', 'nonsense');
    expect(toolsMode(store)).toBe('namespace');
    forgetToolsMode(store);
    expect(store.getSetting('tools_mode')).toBeNull();
  });

  it('tells a refusal of the tools from a refusal of something else', () => {
    const input: InputItem[] = [
      { type: 'message', role: 'developer', content: [] },
      { type: 'additional_tools', role: 'developer', tools: [] },
      call(),
    ];
    expect(pointsAtTools('tools', input)).toBe(true);
    expect(pointsAtTools('tools[0].type', input)).toBe(true);
    expect(pointsAtTools('input[1]', input)).toBe(true);
    expect(pointsAtTools('input[1].tools[0]', input)).toBe(true);
    expect(pointsAtTools('input[2].namespace', input)).toBe(true);
    expect(pointsAtTools('input[2].arguments', input)).toBe(false);
    expect(pointsAtTools('input[0]', input)).toBe(false);
    expect(pointsAtTools('reasoning', input)).toBe(false);
    expect(pointsAtTools('tool_choice', input)).toBe(false);
    expect(pointsAtTools(undefined, input)).toBe(false);
  });

  it('names the namespace on saved calls only while tools go out in one', () => {
    expect(fitCall(call(), 'namespace')).toMatchObject({
      namespace: 'experii',
    });
    expect(fitCall(call({ namespace: 'experii' }), 'flat')).not.toHaveProperty(
      'namespace',
    );
    expect(fitCall(call({ name: 'other' }), 'namespace')).not.toHaveProperty(
      'namespace',
    );
    const message = { type: 'message', role: 'user', content: [] };
    expect(fitCall(message, 'namespace')).toBe(message);
  });
});

describe('runTool', () => {
  it('answers unknown tools and broken arguments with an error output', () => {
    expect(runTool(store, call({ name: 'run_code' }))).toEqual({
      output: '{"error":"unknown_tool"}',
      count: null,
    });
    expect(runTool(store, call({ namespace: 'other' })).count).toBeNull();
    expect(runTool(store, call({ arguments: '{"q":1}' }))).toEqual({
      output: '{"error":"invalid_arguments"}',
      count: null,
    });
    expect(runTool(store, call({ arguments: 'not json' })).count).toBeNull();
    expect(runTool(store, call())).toEqual({
      output: '{"total":0,"cards":[]}',
      count: 0,
    });
  });
});

describe('toolCallsOf', () => {
  it('places each saved call after the message it followed, with its count', () => {
    const rows = [
      { type: 'message', role: 'user', content: [] },
      { type: 'reasoning', encrypted_content: 'x' },
      call({ call_id: 'a', arguments: '{"query":"조인"}' }),
      { type: 'function_call_output', call_id: 'a', output: '{"total":3}' },
      { type: 'message', role: 'assistant', content: [] },
      { type: 'message', role: 'user', content: [] },
      call({ call_id: 'b', name: 'mystery', arguments: '{}' }),
      {
        type: 'function_call_output',
        call_id: 'b',
        output: '{"error":"unknown_tool"}',
      },
    ].map((item, i) => ({
      seq: i + 1,
      type: item.type,
      item_json: JSON.stringify(item),
    }));
    expect(toolCallsOf(rows)).toEqual([
      {
        afterMessage: 0,
        name: 'search_experience_cards',
        label: '내 경험 카드 검색',
        query: '조인',
        count: 3,
      },
      {
        afterMessage: 2,
        name: 'mystery',
        label: 'mystery',
        query: '',
        count: null,
      },
    ]);
  });
});
