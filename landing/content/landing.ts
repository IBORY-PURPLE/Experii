import type { HeroVariant } from '@/lib/signup-schema';
import type { Rich } from '@/lib/rich';

export const meta = {
  title: 'Experii · 공부하는 오늘이, 면접에서 말할 경험이 됩니다',
  description: '내 ChatGPT 계정을 Experii 앱에 등록하면, 이제 공부만 하세요. 면접 소재는 Experii가 쌓아 둡니다.',
  ogAlt: 'Experii · 공부하는 오늘이, 면접에서 말할 경험이 됩니다',
};

export const header = {
  brand: 'Experii',
  cta: '사전 신청하기',
};

export const tickNav = [
  { href: '#top', label: '처음' },
  { href: '#problem', label: '문제' },
  { href: '#shift', label: '질문이 달라졌어요' },
  { href: '#how', label: '작동 방식' },
  { href: '#difference', label: '언제 시작하나요' },
  { href: '#start', label: '귀찮지 않은 시작' },
  { href: '#signup', label: '사전 신청' },
] as const;

export const tickNavLabel = '섹션 바로 가기';

export const hero = {
  kicker: '면접에 집중한 학습 앱',
  headlines: {
    h1: ['공부하는 오늘이,', '면접에서 말할 경험이 됩니다'],
    h2: ['“자격증 있어요” 대신', '“이렇게 써 봤어요”'],
    h3: ['자격증 공부하면서', '면접 답변도 같이 쌓으세요'],
  } satisfies Record<HeroVariant, [string, string]>,
  sub: '내 ChatGPT 계정을 Experii 앱에 등록하면, 이제 공부만 하세요. 면접 소재는 Experii가 쌓아 둡니다.',
  ctaPrimary: '사전 신청하기',
  ctaSecondary: '어떻게 쓰는지 보기',
  figureLabel: '같은 면접 질문에 대한 두 가지 답변 예시',
  badge: '예시',
  interviewer: '면접관',
  question: 'SQL 써 보셨어요?',
  beforeLabel: '자격증만 있을 때',
  before: '자격증 있어요.',
  afterLabel: '과제를 풀어 봤을 때',
  after: '주문 없는 회원을 찾는 과제에서 LEFT JOIN으로 이렇게 써 봤어요.',
  source: '10월 26일 SQLD 대화에서',
  mirror: {
    text: 'LEFT JOIN이랑 INNER JOIN 차이가 헷갈려',
    srPrefix: '예시 질문: ',
    goLabel: '이 질문으로 예시 화면 보기',
    chipsLabel: 'SQLD 질문 예시',
  },
  chips: [
    { topic: 'join', label: 'JOIN 차이가 헷갈려' },
    { topic: 'group', label: 'GROUP BY랑 HAVING' },
    { topic: 'rank', label: 'ROW_NUMBER랑 RANK' },
  ],
} as const;

export const problem = {
  title: '공부 시간은 늘었는데, 면접에서 꺼낼 게 없어요',
  quotes: [
    '“AI와 공부하며 공부 시간은 늘어났는데 이해도는 떨어지는 느낌”',
    '“웹 리서치로 얻은 정보가 노션과 카톡에 누적만 되어 있고 실제로 다시 보지 않음”',
    '“웹 리서치 시간이 너무 아까움”',
  ],
  source: '창업자와 주변 대학생 2명이 실제로 한 말이에요.',
  memo: {
    title: 'SQL JOIN 정리',
    stamps: ['저장함 · 9월 3일', '저장함 · 9월 17일', '저장함 · 10월 2일'],
    reopened: '다시 연 날',
  },
  summary: [
    [{ b: '정리해서 저장은 했는데,' }, ' 다시 열어 본 적은 없어요.'],
    [{ b: '공부는 했는데,' }, ' 면접에서 꺼낼 경험으로는 남지 않아요.'],
  ] satisfies Rich[][],
};

export const shift = {
  title: ['서류는 AI가 도와줘요.', '면접에서 나누는 대화는요?'],
  body: [{ b: '“자격증 있어요”는 첫 질문까지만 답이 돼요.' }, ' 그다음 질문에 답하려면 직접 써 본 경험이 있어야 해요.'] satisfies Rich[],
  interviewer: '면접관',
  bubbles: ['SQLD 있으시네요.', '그럼 SQL을 어떤 과제에서 어떻게 써 봤어요?'],
};

export const how = {
  title: '공부하고, 풀고, 남기고, 다시 꺼내요',
  lead: 'SQLD 공부 하루가 면접 답변 한 줄이 되기까지',
  caption: '예시 화면이에요. 쓰던 GPT를 연결해 이렇게 공부하도록 준비하고 있어요. 지금 보이는 대화는 미리 써 둔 예시예요.',
  close: '공부한 날 한 번 남기면, 그다음은 Experii가 꺼내 줘요.',
  startLink: '이 질문으로 첫 공부 시작하기',
  beats: {
    label: '리마인드 시점',
    badge: '출시 예정 기능',
    fact: '알림은 공부한 날로부터 1일, 7일, 30일 뒤, 딱 세 번 와요.',
    items: [
      { date: '10월 27일 화요일', when: '1일 뒤', what: '배운 점' },
      { date: '11월 2일 월요일', when: '7일 뒤', what: '활용 방안' },
      { date: '11월 25일 수요일', when: '30일 뒤', what: '면접 예상 질문' },
    ],
  },
};

export const difference = {
  title: '지원할 때가 아니라, 공부하는 날마다',
  lead: [{ b: '몇 달 치 기록은 나중에 한꺼번에 만들 수 없어요.' }, ' 공부한 그날 남긴 카드에는 날짜와 내가 쓴 쿼리, 푼 과제가 그대로 있어요.'] satisfies Rich[],
  axis: { study: '자격증 공부', apply: '지원', interview: '면접' },
  rows: { experii: 'Experii', other: '지원할 때 쓰는 도구' },
  figcaption: 'Experii의 경험 카드는 자격증 공부 첫날부터 쌓이고, 지원할 때 쓰는 도구는 지원 시점부터 시작해요.',
  cards: [
    { when: '3개월 전', meta: 'SQLD 1과목 · 정규화', answer: '주문서 엑셀을 회원·주문 테이블로 나누는 과제를 풀어 봤습니다.' },
    { when: '30일 전', meta: 'SQLD 2과목 · 서브쿼리', answer: '평균보다 많이 주문한 회원을 서브쿼리로 찾는 과제를 풀어 봤습니다.' },
    { when: '7일 전', meta: 'SQLD 2과목 · GROUP BY', answer: '취소 주문은 빼고 결제 2건 이상인 재구매 회원을 뽑는 과제를 풀어 봤습니다.' },
    { when: '오늘', meta: 'SQLD 2과목 · JOIN', answer: '주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제를 풀어 봤습니다.' },
  ],
  badge: '예시',
  foot: '면접 날짜가 정해지기 전부터, 공부한 날마다 한 칸씩.',
  notes: [
    [{ b: '지원할 때 쓰는 도구와 같이 써도 돼요.' }, ' Experii는 그 전 몇 달을 맡아요.'],
    ['꾸준히 공부한 만큼 쌓여요.'],
  ] satisfies Rich[][],
};

export const easyStart = {
  title: '출시하면 이렇게 시작해요',
  badge: '예시 화면',
  steps: [
    { lead: '가입은 짧게', rest: ' 바로 공부를 시작할 수 있게 만들고 있어요.' },
    { lead: '쓰던 AI 그대로', rest: ' 이미 구독 중인 ChatGPT를 Experii 앱에 등록할 수 있게 준비하고 있어요.' },
    { lead: '첫 질문 하나', rest: ' 오늘 막힌 SQLD 개념 하나를 물어보면 시작이에요.' },
  ],
  mini: {
    brand: 'Experii',
    start: '시작하기',
    connectTitle: '내 AI 연결',
    connectRow: 'ChatGPT',
    pending: '준비 중',
    subject: 'SQLD',
    placeholder: '오늘 공부하다 막힌 걸 물어보세요',
  },
  band: [{ b: 'Experii 이용료는 받지 않아요.' }, ' AI는 내 ChatGPT 구독(Plus·Pro)으로 써요.'] satisfies Rich[],
  cta: '사전 신청하기',
};

export const signup = {
  title: 'SQLD 공부 중이라면, 먼저 만나 보세요',
  note: 'SQLD를 공부 중인 대학생께 먼저 연락드려요',
  fields: {
    email: '이메일',
    studentStatus: '지금 상황',
    sqldStatus: 'SQLD 공부 상태',
    aiSubscriptions: '유료 AI 구독',
    aiSubscriptionsHint: '여러 개 고를 수 있어요',
    honeypot: '웹사이트',
  },
  options: {
    studentStatus: [
      { value: 'undergrad', label: '대학생' },
      { value: 'job_seeker', label: '졸업 후 취업 준비' },
      { value: 'other', label: '기타' },
    ],
    sqldStatus: [
      { value: 'studying', label: '지금 공부 중' },
      { value: 'planning', label: '공부할 계획' },
      { value: 'certified', label: '이미 취득' },
      { value: 'none', label: '해당 없음' },
    ],
    aiSubscriptions: [
      { value: 'chatgpt_paid', label: 'ChatGPT 유료' },
      { value: 'claude_paid', label: 'Claude 유료' },
      { value: 'none', label: '유료 구독 없음' },
    ],
  },
  errors: {
    email: '이메일 주소를 확인해 주세요',
    student_status: '지금 상황을 골라 주세요',
    sqld_status: 'SQLD 공부 상태를 골라 주세요',
    ai_subscriptions: '하나 이상 골라 주세요',
    consent: '동의해야 신청할 수 있어요',
    server: '잠시 후 다시 시도해 주세요',
  },
  submit: '사전 신청하기',
  submitting: '신청하는 중…',
  done: { title: '신청됐어요.', body: '출시와 시범 사용 소식을 이메일로 알려 드릴게요.' },
};

export const footer = {
  brand: 'Experii',
  notice: '출시 전 제품이며 화면은 예시입니다.',
  privacy: '개인정보 처리방침',
  contactLabel: '문의',
  contactPending: '문의 이메일 (준비 중)',
};

export const sticky = { cta: '사전 신청하기' };

export const privacyPage = {
  back: 'Experii 첫 화면으로',
};
