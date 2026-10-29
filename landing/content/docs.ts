import type { Rich } from '@/lib/rich';

export type DocColor = 'talk' | 'task' | 'card' | 'remind';

export type DocBlock =
  | { kind: 'p'; text: Rich[] }
  | { kind: 'list'; items: Rich[][] }
  | { kind: 'steps'; items: { title: string; body: string; color: DocColor; soon?: boolean }[] }
  | { kind: 'card'; meta: string; answer: string; source: string }
  | { kind: 'qa'; items: { q: string; a: Rich[] }[] }
  | { kind: 'link'; text: string; href: string };

export interface DocSection {
  id: string;
  heading: string;
  blocks: DocBlock[];
}

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  lead: string;
  color?: DocColor;
  soon?: boolean;
  sections: DocSection[];
}

export const docsUi = {
  menu: '가이드',
  menuLabel: '주 메뉴',
  sidebarLabel: '가이드 목차',
  mobileToc: '가이드 목차',
  toc: '이 페이지에서',
  crumbRoot: '가이드',
  prev: '이전',
  next: '다음',
  pagerLabel: '이전·다음 페이지',
  soon: '출시 예정',
  example: '예시',
  callout: '출시되면 이메일로 알려 드려요.',
  cta: '사전 신청하기',
};

const loopSteps: Extract<DocBlock, { kind: 'steps' }> = {
  kind: 'steps',
  items: [
    { title: '학습 대화', body: '앱 안에서 AI에게 SQLD 개념을 물어보며 공부해요.', color: 'talk' },
    { title: '현장 과제', body: '방금 배운 개념을 실제 업무 같은 과제에 써 봐요.', color: 'task' },
    { title: '경험 카드', body: '푼 과제를 면접에서 말할 한 줄로 남겨요.', color: 'card' },
    { title: '리마인드', body: '1일·7일·30일 뒤에 다시 꺼내 보여 줘요.', color: 'remind', soon: true },
  ],
};

const exampleCard: Extract<DocBlock, { kind: 'card' }> = {
  kind: 'card',
  meta: 'SQLD 2과목 · JOIN',
  answer: '주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제를 풀어 봤습니다.',
  source: '10월 26일 SQLD 대화에서',
};

export const docPages: DocPage[] = [
  {
    slug: 'intro',
    title: 'Experii란?',
    description: '자격증 공부를 면접에서 말할 경험으로 남기는 Windows 데스크톱 학습 앱 Experii를 소개해요.',
    lead: '자격증 공부를 면접에서 말할 경험으로 남기는 Windows 데스크톱 학습 앱이에요. 지금은 출시 전이고, 첫 과목은 SQLD예요.',
    sections: [
      {
        id: 'one-line',
        heading: '한 줄로 말하면',
        blocks: [
          {
            kind: 'p',
            text: [
              { b: '공부한 날 푼 과제를 면접 답변 한 줄로 남기고, 나중에 다시 꺼내 줘요.' },
              ' “자격증 있어요”에서 멈추던 답이 “이런 과제에서 이렇게 써 봤어요”로 이어지게 돕는 게 목표예요.',
            ],
          },
        ],
      },
      {
        id: 'who',
        heading: '누구를 위한 앱인가요',
        blocks: [
          {
            kind: 'p',
            text: ['AI와 SQLD 같은 자격증을 공부하면서 “이게 면접에서 쓸모 있을까” 싶은 대학생을 먼저 생각하고 만들고 있어요.'],
          },
        ],
      },
      { id: 'day', heading: '공부한 하루가 이렇게 흘러가요', blocks: [loopSteps] },
      { id: 'card', heading: '경험 카드 예시', blocks: [exampleCard] },
    ],
  },
  {
    slug: 'why',
    title: '왜 공부할 때부터인가요',
    description: '면접 준비를 지원 직전이 아니라 자격증을 공부하는 날부터 시작하는 이유예요.',
    lead: '면접은 “자격증 있어요” 다음 질문부터 시작돼요. 그 질문에 답할 경험은 공부하는 날 쌓을 수 있어요.',
    sections: [
      {
        id: 'question',
        heading: '면접에서 듣는 질문이 달라졌어요',
        blocks: [
          {
            kind: 'p',
            text: [
              '서류는 AI가 도와줄 수 있어요. 면접에서는 “SQLD 있으시네요” 다음에 ',
              { b: '“그럼 SQL을 어떤 과제에서 어떻게 써 봤어요?”' },
              ' 같은 질문이 이어질 수 있어요. 이 질문에는 직접 써 본 경험이 있어야 답할 수 있어요.',
            ],
          },
        ],
      },
      {
        id: 'later',
        heading: '몇 달 치 기록은 나중에 한꺼번에 만들 수 없어요',
        blocks: [
          {
            kind: 'p',
            text: ['공부한 그날 남긴 카드에는 날짜와 내가 쓴 쿼리, 푼 과제가 그대로 있어요. 지원 직전에 기억을 더듬어 만든 답과는 쌓인 방식이 달라요.'],
          },
          {
            kind: 'list',
            items: [
              [{ b: '3개월 전' }, ' 정규화: 주문서 엑셀을 회원·주문 테이블로 나누는 과제'],
              [{ b: '30일 전' }, ' 서브쿼리: 평균보다 많이 주문한 회원을 찾는 과제'],
              [{ b: '오늘' }, ' JOIN: 주문 없는 회원을 LEFT JOIN과 IS NULL로 추리는 과제'],
            ],
          },
        ],
      },
      {
        id: 'together',
        heading: '다른 도구와 같이 써도 돼요',
        blocks: [
          {
            kind: 'p',
            text: ['지원할 때 쓰는 자기소개서·면접 도구와 같이 써도 돼요. Experii는 지원하기 전 몇 달, 공부하는 시간을 맡아요. 꾸준히 공부한 만큼 쌓여요.'],
          },
        ],
      },
    ],
  },
  {
    slug: 'start',
    title: '설치와 계정 등록',
    description: 'Experii 데스크톱 앱을 설치하고 내 ChatGPT 계정을 등록하는 방법이에요. 출시 예정이에요.',
    lead: 'Experii 데스크톱 앱은 출시 전이에요. 출시하면 아래 순서로 시작하도록 준비하고 있어요.',
    soon: true,
    sections: [
      {
        id: 'steps',
        heading: '시작하는 순서',
        blocks: [
          {
            kind: 'list',
            items: [
              [{ b: '설치' }, ' Windows 앱을 내려받아 설치해요. 사전 신청하면 출시할 때 다운로드 링크를 이메일로 보내 드려요.'],
              [{ b: '가입' }, ' 바로 공부를 시작할 수 있게 짧게 만들고 있어요.'],
              [{ b: '계정 등록' }, ' 이미 구독 중인 ChatGPT 계정을 Experii 앱에 등록할 수 있게 준비하고 있어요.'],
              [{ b: '첫 질문' }, ' 오늘 막힌 SQLD 개념 하나를 물어보면 시작이에요.'],
            ],
          },
        ],
      },
      {
        id: 'cost',
        heading: '비용',
        blocks: [
          {
            kind: 'p',
            text: [{ b: 'Experii 이용료는 받지 않아요.' }, ' AI는 내 ChatGPT 구독(Plus·Pro)으로 써요.'],
          },
        ],
      },
    ],
  },
  {
    slug: 'talk',
    title: '학습 대화',
    description: 'Experii 앱 안에서 AI에게 SQLD 개념을 물어보며 공부하는 방법이에요.',
    lead: '공부는 평소처럼 AI에게 물어보면서 해요. 다른 점은 그 대화가 다음 단계의 재료가 된다는 거예요.',
    color: 'talk',
    sections: [
      {
        id: 'how',
        heading: '이렇게 물어보면 돼요',
        blocks: [
          {
            kind: 'p',
            text: ['예를 들어 “LEFT JOIN이랑 INNER JOIN 차이가 헷갈려”라고 물으면, AI가 작은 회원·주문 표로 두 결과가 어떻게 다른지 보여 줘요.'],
          },
          {
            kind: 'p',
            text: [{ b: 'INNER JOIN' }, '은 양쪽에 짝이 있는 행만 남기고, ', { b: 'LEFT JOIN' }, '은 왼쪽 행을 모두 남긴 채 짝이 없으면 NULL로 채워요.'],
          },
        ],
      },
      {
        id: 'next',
        heading: '대화가 끝나면',
        blocks: [
          {
            kind: 'p',
            text: ['대화에서 나온 개념(예: LEFT JOIN, IS NULL)을 찾아 현장 과제로 이어 줘요. 지금 보이는 대화는 미리 써 둔 예시예요.'],
          },
        ],
      },
    ],
  },
  {
    slug: 'task',
    title: '현장 과제',
    description: '배운 개념을 실제 업무 같은 상황에 직접 써 보는 현장 과제를 소개해요.',
    lead: '개념을 외운 것과 써 본 것은 면접에서 다르게 들려요. 현장 과제는 방금 배운 걸 업무 같은 상황에 써 보는 단계예요.',
    color: 'task',
    sections: [
      {
        id: 'example',
        heading: '과제 예시',
        blocks: [
          {
            kind: 'p',
            text: [
              { b: '쇼핑몰 마케팅팀 요청 (가상 상황)' },
              ' 가입은 했지만 아직 한 번도 주문하지 않은 회원에게 첫 구매 쿠폰을 보내려고 해요. 대상 회원의 아이디, 이름, 가입일을 뽑아 주세요.',
            ],
          },
        ],
      },
      {
        id: 'solve',
        heading: '풀어 보면',
        blocks: [
          {
            kind: 'list',
            items: [
              ['쿼리의 빈칸에 들어갈 JOIN을 직접 골라요.'],
              ['INNER JOIN을 고르면 결과가 0행이 되고, 왜 그런지 AI가 짚어 줘요.'],
              ['LEFT JOIN을 고르면 주문 없는 회원 2명이 나오고, 다음 단계로 넘어가요.'],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'card',
    title: '경험 카드',
    description: '푼 과제를 면접에서 말할 한 줄로 남기는 경험 카드를 소개해요.',
    lead: '과제를 풀면 면접에서 그대로 말할 수 있는 한 줄이 카드로 남아요.',
    color: 'card',
    sections: [
      { id: 'example', heading: '카드 예시', blocks: [exampleCard] },
      {
        id: 'inside',
        heading: '카드에 남는 것',
        blocks: [
          {
            kind: 'list',
            items: [
              [{ b: '면접 답변 한 줄' }, ' “SQL을 써 본 적 있나요?” 같은 질문에 답할 문장'],
              [{ b: '배운 점' }, ' LEFT JOIN은 왼쪽 테이블 행을 모두 남기고, 짝이 없으면 NULL로 채운다'],
              [{ b: '날짜와 출처' }, ' 언제, 어떤 대화에서 나온 경험인지'],
            ],
          },
          {
            kind: 'p',
            text: ['쌓인 카드로 이력서와 면접 답변을 쓰는 기능은 출시 뒤에 준비할 예정이에요.'],
          },
        ],
      },
    ],
  },
  {
    slug: 'remind',
    title: '리마인드',
    description: '공부한 내용을 1일·7일·30일 뒤에 다시 꺼내 주는 리마인드 알림이에요. 출시 예정이에요.',
    lead: '정리해 둔 기록은 다시 열어 보지 않으면 남지 않아요. 리마인드는 공부한 날로부터 1일·7일·30일 뒤에 카드를 다시 꺼내 줘요.',
    color: 'remind',
    soon: true,
    sections: [
      {
        id: 'what',
        heading: '알림에 담기는 것',
        blocks: [
          {
            kind: 'list',
            items: [
              [{ b: '배운 점' }, ' 그날 정리한 개념 한 줄'],
              [{ b: '활용 방안' }, ' 그 개념을 어디에 썼는지'],
              [{ b: '면접 예상 질문과 예시 답변' }, ' 경험 카드를 바탕으로 한 질문과 답'],
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'faq',
    title: '자주 묻는 질문',
    description: 'Experii 출시 일정, 비용, 과목에 대해 자주 묻는 질문이에요.',
    lead: '아직 출시 전이라 정해지지 않은 것은 정해지지 않았다고 적었어요.',
    sections: [
      {
        id: 'questions',
        heading: '질문과 답',
        blocks: [
          {
            kind: 'qa',
            items: [
              { q: '지금 쓸 수 있나요?', a: ['아직이에요. 출시 전이고, 사전 신청하면 출시와 시범 사용 소식을 이메일로 알려 드려요.'] },
              { q: '어떤 기기에서 쓰나요?', a: ['Windows 데스크톱 앱으로 준비하고 있어요.'] },
              { q: '비용이 드나요?', a: ['Experii 이용료는 받지 않아요. AI는 내 ChatGPT 구독(Plus·Pro)으로 써요.'] },
              { q: 'SQLD 말고 다른 과목도 되나요?', a: ['첫 과목은 SQLD예요. 다른 과목은 아직 정하지 않았어요.'] },
              { q: '화면에 보이는 대화와 카드는 실제인가요?', a: ['아니요. 출시 전이라 모두 미리 써 둔 예시예요.'] },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'data',
    title: '데이터와 개인정보',
    description: 'Experii 사전 신청 때 받는 정보와 보관 기간을 정리했어요.',
    lead: '지금 Experii가 받는 정보는 사전 신청 정보뿐이에요. 자세한 내용은 개인정보 처리방침에 있어요.',
    sections: [
      {
        id: 'signup',
        heading: '사전 신청 때 받는 정보',
        blocks: [
          {
            kind: 'list',
            items: [
              [{ b: '받는 것' }, ' 이메일, 지금 상황, SQLD 공부 상태, 유료 AI 구독 여부'],
              [{ b: '쓰는 곳' }, ' 출시·시범 사용 안내와 서비스 기획을 위한 응답 집계'],
              [{ b: '보관 기간' }, ' 수집일로부터 1년, 또는 철회를 요청하면 바로 지워요'],
            ],
          },
        ],
      },
      {
        id: 'visit',
        heading: '방문 통계',
        blocks: [
          {
            kind: 'p',
            text: ['방문 통계는 쿠키를 쓰지 않는 도구로 모으고, 이름·전화번호·IP 주소는 저장하지 않아요.'],
          },
          { kind: 'link', text: '개인정보 처리방침 전문 보기', href: '/privacy' },
        ],
      },
    ],
  },
];

export const docGroups: { title: string; slugs: string[] }[] = [
  { title: '시작하기', slugs: ['intro', 'why', 'start'] },
  { title: '작동 방식', slugs: ['talk', 'task', 'card', 'remind'] },
  { title: '도움말', slugs: ['faq', 'data'] },
];
