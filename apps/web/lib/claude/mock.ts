import {
  AdapterError,
  type CaptureInput,
  type CaptureNotesResult,
  type ChatTurn,
  type ClaudeAdapter,
} from './types';

export type MockScenario = 'ok' | 'empty' | 'fail' | 'slow';
export const MOCK_SCENARIOS: MockScenario[] = ['ok', 'empty', 'fail', 'slow'];

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(signal.reason);
    });
  });

// The mock cannot read the image, so its first note says so; the rest show every kind and a low-confidence block
// the way real notes would arrive.
export const MOCK_NOTES: CaptureNotesResult = {
  notes: [
    {
      text: '[데모 필기] 아직 실제 AI를 연결하기 전이라, 캡쳐 내용 대신 예시 필기를 보여 드려요.',
      kind: 'other',
      source_region: 'full',
      confidence: 1,
      raw_excerpt: null,
    },
    {
      text: '정규화는 데이터 중복을 줄여 삽입·삭제·갱신 이상을 막으려고 테이블을 나누는 과정이다.',
      kind: 'concept',
      source_region: 'top',
      confidence: 0.93,
      raw_excerpt: '정규화(Normalization): 이상 현상을 제거하기 위해 릴레이션을 분해하는 과정',
    },
    {
      text: '1NF → 2NF(부분 종속 제거) → 3NF(이행 종속 제거) 순서로 진행한다.',
      kind: 'step',
      source_region: 'middle',
      confidence: 0.88,
      raw_excerpt: '1NF: 원자값 / 2NF: 부분 함수 종속 제거 / 3NF: 이행 함수 종속 제거',
    },
    {
      text: '반정규화는 조회 성능을 위해 일부러 중복을 허용하는 것이라 정규화와 헷갈리지 않게 주의.',
      kind: 'warning',
      source_region: 'bottom',
      confidence: 0.55,
      raw_excerpt: null,
    },
    {
      text: '학번 → 학과 → 학과장 예시로 이행 종속을 직접 나눠 보기.',
      kind: 'todo',
      source_region: 'bottom',
      confidence: 0.8,
      raw_excerpt: null,
    },
  ],
  reason: null,
  redacted: 0,
};

const EMPTY: CaptureNotesResult = {
  notes: [],
  reason: '이미지가 너무 작거나 비어 있어서 필기로 남길 학습 내용을 찾지 못했어요.',
  redacted: 0,
};

export function mockChatAnswer(question: string): string {
  const q = question.replace(/\s+/g, ' ').trim().slice(0, 120);
  return `_(데모 응답 · 실제 AI 연결 전이라 미리 준비한 답을 보여 드려요.)_

**질문:** ${q}

### 핵심 정리
- **정규화**는 데이터 중복을 줄이고 이상 현상을 막으려고 테이블을 나누는 과정이에요.
- **1NF**: 모든 칸에 값이 하나만 들어가요.
- **2NF**: 기본키의 일부에만 의존하는 속성을 따로 떼어 내요.
- **3NF**: 키가 아닌 속성끼리의 의존(이행 종속)을 없애요.

| 단계 | 없애는 것 | 예시 |
|---|---|---|
| 1NF | 반복 그룹 | 전화번호 여러 개를 한 칸에 |
| 2NF | 부분 함수 종속 | (학번, 과목) → 학생 이름 |
| 3NF | 이행 함수 종속 | 학번 → 학과 → 학과장 |

> 남기고 싶은 부분을 캡쳐해서(Windows: Win+Shift+S, Mac: Cmd+Shift+4) 왼쪽 보드에 붙여 넣어 보세요(Ctrl+V). 필기는 자동으로 만들어 드려요.`;
}

export function createMockAdapter(
  opts: { scenario?: MockScenario; delayMs?: number } = {},
): ClaudeAdapter {
  const scenario = opts.scenario ?? 'ok';
  const delay = opts.delayMs ?? 1500;
  return {
    name: 'mock',
    model: 'mock',
    async generateNotesFromCapture(input: CaptureInput, signal?: AbortSignal) {
      await sleep(scenario === 'slow' ? delay * 4 : delay, signal);
      if (scenario === 'fail')
        throw new AdapterError('mock_failure', '목 어댑터가 실패를 흉내 냈어요.');
      const tiny = (input.width ?? 100) < 48 || (input.height ?? 100) < 48;
      if (scenario === 'empty' || tiny) return structuredClone(EMPTY);
      return structuredClone(MOCK_NOTES);
    },
    async *streamChat(turns: ChatTurn[], signal?: AbortSignal) {
      const last = [...turns].reverse().find((t) => t.role === 'user')?.content ?? '';
      const answer = mockChatAnswer(last);
      await sleep(Math.min(400, delay), signal);
      const parts = answer.match(/[\s\S]{1,12}/g) ?? [];
      for (const part of parts) {
        await sleep(18, signal);
        yield part;
      }
    },
  };
}
