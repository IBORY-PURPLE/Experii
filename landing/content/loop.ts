import type { Rich } from '@/lib/rich';

export type { Rich };
export type TopicId = 'join' | 'group' | 'rank';
export type Step = 1 | 2 | 3 | 4;

export interface MockTable {
  caption?: string;
  columns: string[];
  rows: string[][];
  highlightRow?: number;
}

export type SqlPart = string | { kw: string } | { blank: true };
export interface SqlLine {
  indent?: number;
  parts: SqlPart[];
}

export type ChatItem =
  | { kind: 'p'; text: Rich[] }
  | { kind: 'tables'; tables: MockTable[] }
  | { kind: 'table'; table: MockTable };

export interface CheckLine {
  b: string;
  rest?: string;
}

export interface ListRow {
  when: string;
  meta: string;
  title: string;
}

export interface Reminder {
  preview: string;
  more?: string;
}

export interface CardCopy {
  question: string;
  answer: string;
  lesson: string;
  snippet: string;
  tags: string[];
}

export type RightResult = MockTable | { chip: string; line: string };

export interface LoopTopic {
  id: TopicId;
  chip: string;
  question: string;
  explain: ChatItem[];
  ask: string;
  reply: string;
  offer: string;
  checks: [CheckLine, CheckLine, CheckLine];
  task: { from: string; body: string; tables: string[]; note?: string };
  hint: string;
  optionsLabel: string;
  sql: SqlLine[];
  options: [string, string];
  answer: string;
  right: { result: RightResult; ai: string; live: string };
  wrong: { chip: string; ai: string; live: string };
  card: CardCopy;
  excerpt: SqlLine[];
  flyLine: number;
  list: { now: ListRow; old: [ListRow, ListRow] };
  reminders: [Reminder, Reminder, Reminder];
  follow: { question: string; tail?: { q: string; sql: SqlLine[] } };
}

const kw = (k: string) => ({ kw: k });
const BLANK = { blank: true } as const;

const joinTopic: LoopTopic = {
  id: 'join',
  chip: 'JOIN 차이가 헷갈려',
  question: 'LEFT JOIN이랑 INNER JOIN 차이가 헷갈려',
  explain: [
    { kind: 'p', text: ['둘 다 member_id로 두 테이블을 잇는 건 같아요. 차이는 짝이 없는 행을 어떻게 하느냐예요.'] },
    {
      kind: 'tables',
      tables: [
        { caption: 'members', columns: ['member_id', 'member_name'], rows: [['1', '민지'], ['2', '서준'], ['3', '하린']] },
        { caption: 'orders', columns: ['order_id', 'member_id'], rows: [['101', '1'], ['102', '1'], ['103', '3']] },
      ],
    },
    { kind: 'p', text: [{ b: 'INNER JOIN' }, '은 양쪽에 짝이 있는 행만 남겨요. 주문이 없는 서준은 빠져서 결과가 3행이에요.'] },
    {
      kind: 'table',
      table: {
        caption: '결과 표 A (INNER JOIN, 3행)',
        columns: ['member_name', 'order_id'],
        rows: [['민지', '101'], ['민지', '102'], ['하린', '103']],
      },
    },
    { kind: 'p', text: [{ b: 'LEFT JOIN' }, '은 왼쪽(회원) 행을 모두 남기고, 짝이 없으면 주문 칸을 NULL로 채워요. 그래서 4행이에요.'] },
    {
      kind: 'table',
      table: {
        caption: '결과 표 B (LEFT JOIN, 4행)',
        columns: ['member_name', 'order_id'],
        rows: [['민지', '101'], ['민지', '102'], ['서준', 'NULL'], ['하린', '103']],
        highlightRow: 2,
      },
    },
  ],
  ask: '그럼 하나 물어볼게요. 주문을 한 번도 안 한 회원만 뽑으려면, 결과 표 B에서 어떤 행을 고르면 될까요?',
  reply: 'LEFT JOIN 하고 주문 칸이 NULL인 행?',
  offer: '맞아요. 회원 데이터를 다룰 때 자주 나오는 모양이에요. 방금 배운 걸로 현장 과제 하나 풀어 볼래요?',
  checks: [
    { b: '대화에서 개념 찾기', rest: 'LEFT JOIN, IS NULL' },
    { b: '상황 고르기', rest: '쇼핑몰 회원·주문 데이터' },
    { b: '현장 과제 만들기' },
  ],
  task: {
    from: '쇼핑몰 마케팅팀 요청 (가상 상황)',
    body: '가입은 했지만 아직 한 번도 주문하지 않은 회원에게 첫 구매 쿠폰을 보내려고 해요. 대상 회원의 아이디, 이름, 가입일을 뽑아 주세요.',
    tables: ['members(member_id, member_name, joined_at)', 'orders(order_id, member_id, ordered_at)'],
  },
  hint: '앱 화면의 빈칸에 들어갈 JOIN을 직접 골라 보세요.',
  optionsLabel: '빈칸에 들어갈 JOIN 고르기',
  sql: [
    { parts: [kw('SELECT'), ' m.member_id, m.member_name, m.joined_at'] },
    { parts: [kw('FROM'), ' members m'] },
    { parts: [BLANK, ' orders o'] },
    { indent: 2, parts: [kw('ON'), ' m.member_id = o.member_id'] },
    { parts: [kw('WHERE'), ' o.order_id ', kw('IS NULL'), ';'] },
  ],
  options: ['INNER JOIN', 'LEFT JOIN'],
  answer: 'LEFT JOIN',
  right: {
    result: {
      caption: '결과 2행',
      columns: ['member_id', 'member_name', 'joined_at'],
      rows: [['2', '서준', '2026-09-10'], ['4', '도윤', '2026-10-12']],
    },
    ai: '맞아요. 주문이 없는 회원은 주문 칸이 NULL로 남아서 WHERE에서 골라져요.',
    live: '결과 2행, 서준과 도윤. 맞아요. 주문이 없는 회원은 주문 칸이 NULL로 남아서 WHERE에서 골라져요.',
  },
  wrong: {
    chip: '결과 0행',
    ai: '결과가 0행이에요. INNER JOIN은 주문이 없는 회원을 처음부터 빼서, o.order_id가 NULL인 행이 남지 않아요. LEFT JOIN으로 바꿔 볼까요?',
    live: '결과 0행. INNER JOIN은 주문이 없는 회원을 처음부터 빼요. LEFT JOIN으로 바꿔 볼까요?',
  },
  card: {
    question: 'SQL을 써 본 적 있나요?',
    answer: '쇼핑몰 회원·주문 데이터에서 한 번도 주문하지 않은 회원을 LEFT JOIN과 IS NULL로 추려, 첫 구매 쿠폰 대상 목록을 만드는 과제를 풀어 봤습니다.',
    lesson: 'LEFT JOIN은 왼쪽 테이블 행을 모두 남기고, 짝이 없으면 NULL로 채운다.',
    snippet: 'LEFT JOIN … IS NULL',
    tags: ['SQLD', '2과목', 'JOIN'],
  },
  excerpt: [
    { parts: [kw('FROM'), ' members m'] },
    { parts: [kw('LEFT JOIN'), ' orders o'] },
    { indent: 2, parts: [kw('ON'), ' m.member_id = o.member_id'] },
    { parts: [kw('WHERE'), ' o.order_id ', kw('IS NULL'), ';'] },
  ],
  flyLine: 1,
  list: {
    now: { when: '오늘', meta: 'SQLD 2과목 · JOIN', title: '주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제' },
    old: [
      { when: '7일 전', meta: 'SQLD 2과목 · GROUP BY', title: '결제 2건 이상인 재구매 회원을 뽑는 과제' },
      { when: '30일 전', meta: 'SQLD 2과목 · 서브쿼리', title: '평균보다 많이 주문한 회원을 찾는 과제' },
    ],
  },
  reminders: [
    {
      preview: 'LEFT JOIN은 왼쪽 표의 행을 모두 남겨요. 주문이 없는 회원은 주문 칸이 NULL이라 IS NULL로 찾았죠.',
      more: '어제 쓴 쿼리 다시 보기 →',
    },
    {
      preview: "'한 번도 ~하지 않은' 대상을 찾을 땐 같은 모양이에요. 예: 강의를 결제하고 한 번도 듣지 않은 수강생 찾기.",
      more: 'IS NULL 조건은 ON이 아니라 WHERE에 둬요. ON에 넣으면 회원이 모두 그대로 나와요.',
    },
    { preview: '면접 질문: "SQL을 실제로 써 본 적 있나요?" 내 답변 한 줄 다시 보기 →' },
  ],
  follow: {
    question: '면접 질문: "SQL을 실제로 써 본 적 있나요?"',
    tail: {
      q: '같은 결과를 다른 방법으로도 낼 수 있나요? → NOT EXISTS로도 찾을 수 있어요.',
      sql: [
        { parts: [kw('SELECT'), ' m.member_id, m.member_name, m.joined_at'] },
        { parts: [kw('FROM'), ' members m'] },
        { parts: [kw('WHERE NOT EXISTS'), ' ('] },
        { indent: 2, parts: [kw('SELECT'), ' 1'] },
        { indent: 2, parts: [kw('FROM'), ' orders o'] },
        { indent: 2, parts: [kw('WHERE'), ' o.member_id = m.member_id'] },
        { parts: [');'] },
      ],
    },
  },
};

const groupTopic: LoopTopic = {
  id: 'group',
  chip: 'GROUP BY랑 HAVING',
  question: 'GROUP BY랑 HAVING 차이가 뭐야? WHERE랑 헷갈려',
  explain: [
    {
      kind: 'p',
      text: ['WHERE는 묶기 전에 행을 하나씩 거르고, HAVING은 GROUP BY로 묶은 다음 그룹을 걸러요. 그래서 COUNT(*) 같은 집계 조건은 HAVING에 써요.'],
    },
    {
      // 파생: §3.6 B 예시 데이터를 표로
      kind: 'table',
      table: {
        caption: 'orders',
        columns: ['order_id', 'member_id', 'status'],
        rows: [
          ['101', '1', 'PAID'],
          ['102', '1', 'PAID'],
          ['103', '3', 'PAID'],
          ['104', '3', 'CANCELLED'],
          ['105', '4', 'PAID'],
        ],
      },
    },
  ],
  ask: "취소된 주문은 빼고 2번 이상 결제한 회원을 찾으려면, '취소 제외'와 '2번 이상'은 각각 어디에 쓸까요?",
  reply: '취소 제외는 WHERE, 2번 이상은 HAVING?',
  offer: '맞아요. 방금 배운 걸로 현장 과제 하나 풀어 볼래요?', // 파생: §3.2 S4에서 가운데 문장 삭제
  checks: [
    { b: '대화에서 개념 찾기', rest: 'WHERE, GROUP BY, HAVING' },
    { b: '상황 고르기', rest: '쇼핑몰 주문 데이터' },
    { b: '현장 과제 만들기' },
  ],
  task: {
    from: '쇼핑몰 CRM팀 요청 (가상 상황)',
    body: '결제 완료 주문이 2건 이상인 재구매 회원을 뽑아 주세요. 취소된 주문은 세지 않아요.',
    tables: ['orders(order_id, member_id, ordered_at, status)'],
    note: "status는 'PAID' 또는 'CANCELLED'",
  },
  hint: '앱 화면의 빈칸에 들어갈 절을 직접 골라 보세요.', // 초안
  optionsLabel: '빈칸에 들어갈 절 고르기', // 초안
  sql: [
    { parts: [kw('SELECT'), ' member_id, COUNT(*) ', kw('AS'), ' paid_orders'] },
    { parts: [kw('FROM'), ' orders'] },
    { parts: [kw('WHERE'), " status = 'PAID'"] },
    { parts: [kw('GROUP BY'), ' member_id'] },
    { parts: [BLANK, ' COUNT(*) >= 2;'] },
  ],
  options: ['WHERE', 'HAVING'],
  answer: 'HAVING',
  right: {
    result: { caption: '결과 1행', columns: ['member_id', 'paid_orders'], rows: [['1', '2']] },
    ai: '맞아요. WHERE는 묶기 전의 행을, HAVING은 묶은 뒤의 그룹을 걸러요.', // 파생: '맞아요.' + §3.6 B 1일 알림 첫 문장
    live: '결과 1행, 회원 1번. 맞아요.', // 초안
  },
  wrong: {
    chip: '실행 오류', // 초안
    ai: 'WHERE에는 COUNT 같은 집계 함수를 쓸 수 없어서 오류가 나요. 묶은 다음 거르는 건 HAVING이에요.',
    live: '실행 오류. WHERE에는 COUNT 같은 집계 함수를 쓸 수 없어요.', // 초안
  },
  card: {
    question: '데이터에서 조건에 맞는 고객을 뽑아 본 적 있나요?', // 파생: §3.6 B 30일 알림
    answer: '주문 데이터에서 취소 주문은 WHERE로 빼고, GROUP BY와 HAVING으로 결제 2건 이상인 재구매 회원을 뽑는 과제를 풀어 봤습니다.',
    lesson: 'WHERE는 묶기 전의 행을, HAVING은 묶은 뒤의 그룹을 거른다.', // 파생: §3.6 B 1일 알림을 §3.4 배운 점 말투로
    snippet: 'HAVING COUNT(*) >= 2', // 파생
    tags: ['SQLD', '2과목', 'GROUP BY'],
  },
  excerpt: [
    // 파생
    { parts: [kw('WHERE'), " status = 'PAID'"] },
    { parts: [kw('GROUP BY'), ' member_id'] },
    { parts: [kw('HAVING'), ' COUNT(*) >= 2;'] },
  ],
  flyLine: 2,
  list: {
    // 파생: §3.2 S9 줄 + §2.5 카드 더미에서 '를 풀어 봤습니다' 삭제
    now: { when: '오늘', meta: 'SQLD 2과목 · GROUP BY', title: '결제 2건 이상인 재구매 회원을 뽑는 과제' },
    old: [
      { when: '30일 전', meta: 'SQLD 2과목 · 서브쿼리', title: '평균보다 많이 주문한 회원을 찾는 과제' },
      { when: '3개월 전', meta: 'SQLD 1과목 · 정규화', title: '주문서 엑셀을 회원·주문 테이블로 나누는 과제' },
    ],
  },
  reminders: [
    {
      preview: 'WHERE는 묶기 전의 행을, HAVING은 묶은 뒤의 그룹을 걸러요. 집계 조건은 HAVING에.',
      more: '어제 쓴 쿼리 다시 보기 →',
    },
    { preview: "'n번 이상', '합계 n원 이상'처럼 그룹 단위 조건이 나오면 HAVING이에요. 예: 한 학기에 세 번 이상 결석한 학생 찾기." },
    { preview: '면접 질문: "데이터에서 조건에 맞는 고객을 뽑아 본 적 있나요?" 내 답변 한 줄 다시 보기 →' },
  ],
  follow: { question: '면접 질문: "데이터에서 조건에 맞는 고객을 뽑아 본 적 있나요?"' },
};

const rankTopic: LoopTopic = {
  id: 'rank',
  chip: 'ROW_NUMBER랑 RANK',
  question: 'ROW_NUMBER랑 RANK 차이가 뭐야?',
  explain: [
    {
      kind: 'p',
      text: ['둘 다 순서대로 번호를 매겨요. 값이 같으면 RANK는 같은 순위를 주고 다음 순위를 건너뛰어요(1, 1, 3). ROW_NUMBER는 같아도 1, 2, 3처럼 서로 다른 번호를 줘요.'],
    },
  ],
  ask: '회원마다 주문을 딱 1건만 남기고 싶다면 어느 쪽이 안전할까요?',
  reply: '겹치면 안 되니까 ROW_NUMBER?',
  offer: '맞아요. 방금 배운 걸로 현장 과제 하나 풀어 볼래요?', // 파생: 세트 B와 같음
  checks: [
    { b: '대화에서 개념 찾기', rest: 'ROW_NUMBER, PARTITION BY' },
    { b: '상황 고르기', rest: '쇼핑몰 주문 데이터' },
    { b: '현장 과제 만들기' },
  ],
  task: {
    from: '고객센터팀 요청 (가상 상황)',
    body: '회원마다 가장 최근 결제 주문 1건만 뽑아 주세요. 같은 날 주문이 두 건인 회원도 있어요.',
    tables: ['orders(order_id, member_id, ordered_at, status)'], // 파생: 세트 B와 같은 테이블
  },
  hint: '앱 화면의 빈칸에 들어갈 함수를 직접 골라 보세요.', // 초안
  optionsLabel: '빈칸에 들어갈 함수 고르기', // 초안
  sql: [
    { parts: [kw('SELECT'), ' member_id, order_id, ordered_at'] },
    { parts: [kw('FROM'), ' ('] },
    { indent: 2, parts: [kw('SELECT'), ' member_id, order_id, ordered_at,'] },
    { indent: 9, parts: [BLANK, ' ', kw('OVER'), ' (', kw('PARTITION BY'), ' member_id ', kw('ORDER BY'), ' ordered_at ', kw('DESC'), ') ', kw('AS'), ' rn'] },
    { indent: 2, parts: [kw('FROM'), ' orders'] },
    { indent: 2, parts: [kw('WHERE'), " status = 'PAID'"] },
    { parts: [') t'] },
    { parts: [kw('WHERE'), ' rn = 1;'] },
  ],
  options: ['ROW_NUMBER()', 'RANK()'],
  answer: 'ROW_NUMBER()',
  right: {
    result: { chip: '결과 3행', line: '회원 1·3·4가 한 건씩' }, // 칩 파생
    ai: '맞아요. 윈도우 함수 결과(rn)는 같은 SELECT의 WHERE에서 바로 쓸 수 없어서 FROM 안에 한 번 감쌌어요.', // 파생: '맞아요.' + §3.6 AI 덧붙임
    live: '결과 3행, 회원 1·3·4가 한 건씩. 맞아요.', // 초안
  },
  wrong: {
    chip: '결과 4행', // 파생: 회원 1·3 한 건 + 회원 4 두 건
    ai: '같은 날 결제한 주문이 두 건이면 RANK는 둘 다 1이라 회원 4번은 2건이 나와요. 회원당 1건이 필요하면 ROW_NUMBER예요.',
    live: '결과 4행. RANK는 같은 날 주문에 같은 번호를 줘요.', // 초안
  },
  card: {
    question: '중복 데이터를 정리해 본 적 있나요?', // 파생: §3.6 C 30일 알림
    answer: '주문 데이터에 ROW_NUMBER로 회원별 최신순 번호를 매기고, 인라인 뷰로 1번만 골라 회원별 최근 결제 주문을 뽑는 과제를 풀어 봤습니다.',
    lesson: '값이 같을 때 RANK는 같은 번호, ROW_NUMBER는 다른 번호를 준다.', // 파생: §3.6 C 1일 알림
    snippet: 'ROW_NUMBER() … rn = 1', // 파생
    tags: ['SQLD', '2과목', '윈도우 함수'],
  },
  excerpt: [
    // 파생
    { indent: 2, parts: [kw('ROW_NUMBER()'), ' ', kw('OVER'), ' (', kw('PARTITION BY'), ' member_id ', kw('ORDER BY'), ' ordered_at ', kw('DESC'), ') ', kw('AS'), ' rn'] },
    { indent: 2, parts: [kw('FROM'), ' orders'] },
    { indent: 2, parts: [kw('WHERE'), " status = 'PAID'"] },
    { parts: [') t'] },
    { parts: [kw('WHERE'), ' rn = 1;'] },
  ],
  flyLine: 0,
  list: {
    now: { when: '오늘', meta: 'SQLD 2과목 · 윈도우 함수', title: '회원별 최근 결제 주문을 뽑는 과제' }, // 파생: §3.6 C 답변 한 줄 줄임
    old: [
      { when: '7일 전', meta: 'SQLD 2과목 · GROUP BY', title: '결제 2건 이상인 재구매 회원을 뽑는 과제' },
      { when: '30일 전', meta: 'SQLD 2과목 · 서브쿼리', title: '평균보다 많이 주문한 회원을 찾는 과제' },
    ],
  },
  reminders: [
    { preview: '값이 같을 때 RANK는 같은 번호, ROW_NUMBER는 다른 번호를 줘요.', more: '어제 쓴 쿼리 다시 보기 →' },
    { preview: "'그룹마다 n건만' 뽑을 땐 PARTITION BY + ROW_NUMBER를 인라인 뷰로 감싸요. 예: 학과별 최근 공지 1건." },
    { preview: '면접 질문: "중복 데이터를 정리해 본 적 있나요?" 내 답변 한 줄 다시 보기 →' },
  ],
  follow: { question: '면접 질문: "중복 데이터를 정리해 본 적 있나요?"' },
};

export const loopTopics: Record<TopicId, LoopTopic> = {
  join: joinTopic,
  group: groupTopic,
  rank: rankTopic,
};

export const loopShared = {
  island: '예시 화면',
  subject: 'SQLD · 2과목',
  studyDate: '10월 26일 (월)',
  s0Guide: '오늘 공부하다 막힌 걸 물어보세요',
  gpt: '내 GPT',
  gptState: '연결 준비 중',
  placeholder: '질문을 입력하세요',
  who: 'AI',
  fakeTake: '과제 받기',
  fakeSave: '경험 카드로 저장',
  status: '방금 대화에서 과제를 만드는 중…',
  taskPill: '현장 과제',
  tablesLabel: '쓰는 테이블',
  cardAi: '방금 푼 과제를 면접 답변 한 줄로 정리했어요. 내 말투에 맞게 고쳐도 돼요.',
  cardHead: '경험 카드 · 2026.10.26 (월)',
  cardLabels: {
    question: '면접 질문',
    answer: '내 답변 한 줄',
    lesson: '배운 점',
    query: '내가 쓴 쿼리',
    plan: '다시 볼 날',
  },
  source: '출처 · 10월 26일 SQLD 대화',
  revisitDates: ['10월 27일', '11월 2일', '11월 25일'],
  listTitle: '내 경험 카드',
  toast: '저장했어요. 내일 다시 꺼내 드릴게요.',
  appName: 'Experii',
  appIcon: 'E',
  lockDates: [
    { md: '10월 27일', dow: '화요일' },
    { md: '11월 2일', dow: '월요일' },
    { md: '11월 25일', dow: '수요일' },
  ],
  reminderDates: ['10월 27일 화요일', '11월 2일 월요일', '11월 25일 수요일'],
  reminderLabels: ['공부 1일 뒤 · 배운 점', '공부 7일 뒤 · 활용 방안', '공부 30일 뒤 · 면접 예상 질문'],
  lockBadge: '출시 예정 기능',
  lockHint: '알림을 눌러 넘겨 보세요',
  openedTitle: '경험 카드',
  openedDate: '11월 25일 (수)',
  revisitLabel: '다시 본 날',
  followTail: '꼬리질문 대비',
  nav: { study: '오늘 공부', cards: '내 경험 카드', remind: '리마인드' },
} as const;

export const loopCopy = {
  tablistLabel: '작동 방식 4단계',
  topicsLabel: '다른 질문으로 보기',
  steps: [
    {
      when: '공부한 날',
      name: '학습 대화',
      detail: [{ b: 'AI와 평소처럼 공부해요.' }, ' 막힌 개념을 물으면 예시 표로 풀어 주고, 거꾸로 질문도 던져요.'] as Rich[],
      next: '다음 단계: 현장 과제',
    },
    {
      when: '공부한 날',
      name: '현장 과제',
      detail: [{ b: '배운 걸 바로 써 봐요.' }, ' 방금 대화에서 실무 상황 과제가 나와요.'] as Rich[],
      next: '다음 단계: 경험 카드',
    },
    {
      when: '공부한 날',
      name: '경험 카드',
      detail: [{ b: '푼 경험이 답변 한 줄로.' }, ' 면접에서 꺼낼 한 줄을 카드로 저장해요.'] as Rich[],
      next: '다음 단계: 리마인드',
    },
    {
      when: '1·7·30일 뒤',
      name: '리마인드',
      detail: [{ b: '잊을 즈음 다시 꺼내 줘요.' }, ' 배운 점, 활용 방안, 면접 예상 질문이 알림으로 와요.'] as Rich[],
      next: '다음 알림',
    },
  ],
  remind: {
    next: '다음 알림',
    open: '30일 알림 열기',
    restart: '처음 알림부터 다시',
    soon: '출시 예정 기능',
    fact: '알림은 공부한 날로부터 1일, 7일, 30일 뒤, 딱 세 번 와요.',
    rulerStart: '10월 26일 공부한 날',
    rulerEnd: '11월 25일',
    hitNext: '다음 알림 보기',
    hitOpen: '30일 알림 열기',
  },
  threads: {
    chat: '예시 대화, 미리 써 둔 대화',
    task: '예시 화면, 현장 과제',
    card: '예시 화면, 경험 카드 정리', // 초안
    list: '예시 화면, 내 경험 카드 목록', // 초안
    opened: '예시 화면, 다시 열린 경험 카드', // 초안
  },
  live: {
    tab: '{n}단계 {name}, 예시 화면',
    topic: '질문을 바꿨어요. {chip}. 1단계 학습 대화, 예시 화면', // 초안
    reminder: '{date}, {label} 알림',
    reminderLabels: ['공부 1일 뒤, 배운 점', '공부 7일 뒤, 활용 방안', '공부 30일 뒤, 면접 예상 질문'],
    opened: '30일 알림을 열었어요. 10월 26일에 만든 경험 카드가 다시 열렸어요. 다시 본 날 10월 27일, 11월 2일, 11월 25일.',
  },
};

// Hero window autoplay (set A). Tiles reuse the card list lines of sets A and B.
export const heroDemo = {
  recentTitle: '최근 경험 카드',
  recent: [joinTopic.list.old[0], joinTopic.list.old[1], groupTopic.list.old[1]],
  control: { idle: '재생', playing: '일시정지', paused: '재생', ended: '다시 보기' },
  controlTarget: '앱 예시 화면',
  summary:
    '예시 화면: SQLD 공부 중 막힌 걸 물으면 AI가 예시 표로 설명하고, 현장 과제를 풀면 면접 답변 한 줄이 경험 카드로 저장돼요. 1일, 7일, 30일 뒤 알림이 오고, 30일 알림을 누르면 같은 카드가 다시 열려요.',
};

export type LoopShared = typeof loopShared;
export type HeroDemoCopy = typeof heroDemo;
export type LoopCopy = typeof loopCopy;
