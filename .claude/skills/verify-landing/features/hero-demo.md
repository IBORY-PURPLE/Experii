# 히어로 데모

첫 화면 가운데의 Experii 데스크톱 앱 창 안에서 약 25초짜리 한 컷이 자동으로 재생된다. 순서는 질문 타이핑 → AI 설명 → 현장 과제 → 커서가 LEFT JOIN 클릭 → 경험 카드 저장 → 1·7·30일 알림 → 같은 카드 다시 열림이다. 한 번 재생하고 멈추며, 일시정지와 다시 보기가 있다.

## Sub-features

- `hero-play` 화면에 들어오면 재생이 시작되고 끝까지 간다.
- `hero-pause` 재생 중 `일시정지`를 누르면 멈추고 버튼이 `재생`이 된다. 버튼 상자는 그대로다.
- `hero-replay` 끝나면 `다시 보기`가 처음부터 다시 튼다.
- `hero-reduced` 동작 줄이기 설정이면 마지막 장면에서 멈춘 화면을 보여 준다.
- `hero-short` 짧은 노트북 창(1536×730, 1366×657, 1280×690)에서도 스크롤 없이 끝까지 재생된다.

## How to get to it (user POV)

- 랜딩 첫 화면을 연다. 앱 창이 첫 화면 아래로 이어진다.
- 앱 창 왼쪽 위 재생 컨트롤(`일시정지` / `재생` / `다시 보기`)을 누른다.

## Driving it with Playwright

Preconditions:

- Doctor가 0 또는 2다.
- evidence 프로젝트(`reducedMotion: 'no-preference'`)이거나, 일반 프로젝트에서 동작 줄이기 장면만 본다.

- **재생 단계별 증거.** `npm --prefix landing run evidence`의 `히어로 데모가 끝까지 재생된다` 장면을 쓴다. 각 단계는 `.hd-ask.typing`, `.hd-flow .task`, `.hd-flow .blank.is-right`, `.hd-flow .fake.save.done`, `.hero-demo[data-remind="3"]`, `.hero-demo[data-play="ended"]`가 나타나는 것으로 판정한다. 결과로 `hero-<창>-01…06.png`와 `hero-<창>.webm`이 남는다.
- **일시정지·다시 보기.** `npm --prefix landing run test:e2e:prod -- tests/e2e/hero.spec.ts`. `getByRole('button', { name: /일시정지/ })`를 누르면 그림이 멈추고, 끝나면 `getByRole('button', { name: /다시 보기/ })`가 보인다.
- **동작 줄이기.** 같은 스펙의 reduced motion 테스트가 마지막 장면 정지를 확인한다.
- **짧은 창.** 같은 스펙이 짧은 창 3종을 desktop 프로젝트에서 한 번씩 돌린다.

## Gotchas

- 창 높이 761~778px에서는 짧은 창 레이아웃(≤760px)이 적용되지 않는다. 약 10초에 빈칸 장면에서 멈추고 "조금 내리면 이어서 재생돼요"가 뜬다. 알려진 결함이며 고칠 때 이 범위를 같이 검증한다.
- 탭이 숨으면 재생이 멈춘다. 백그라운드 탭에서 찍으면 타이밍이 틀어진다.
- 개발 서버에서 찍으면 dev 오버레이(`nextjs-portal`)가 끼어든다. 프로덕션에서만 판정한다.
