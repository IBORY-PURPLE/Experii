# 섹션 4 직접 해 보기

작동 방식 섹션(`#stage`)에서 방문자가 같은 데스크톱 앱 창으로 학습 루프를 직접 넘겨 본다. 1 대화, 2 현장 과제(빈칸에 JOIN 고르기), 3 경험 카드 저장, 4 1·7·30일 알림을 넘기면 같은 카드가 다시 열린다.

## Sub-features

- `s4-chat` 1단계 대화가 보이고 `#stage[data-ready]`가 붙는다.
- `s4-task-wrong` 2단계에서 `INNER JOIN`을 고르면 오답 표시(`.res-chip.bad`)가 뜬다.
- `s4-task-right` `LEFT JOIN`을 고르면 결과 표(`.res-table`)가 나오고 `다음 단계: 경험 카드`가 보인다.
- `s4-save` 3단계 `경험 카드로 저장`을 누르면 카드 목록(`.l-list.shown`)이 보인다.
- `s4-remind` 4단계에서 알림을 1일 → 7일 → 30일로 넘기고 30일 알림을 열면 같은 카드(`.l-card.shown`)가 열린다.

## How to get to it (user POV)

- 헤더의 작동 방식 링크(`#how`)를 누르거나 섹션 4까지 스크롤한다.
- 단계 탭 `#loop-tab-1`…`#loop-tab-4`를 누른다.

## Driving it with Playwright

Preconditions:

- Doctor가 0 또는 2다.
- 폭 1024px 이상(데스크톱 앱 창)이다.

- **전 과정 증거.** evidence의 `섹션 4에서 직접 해 보기` 장면이 9단계 PNG(`s4-1440x900-*`)와 `s4-1440x900.webm`을 남긴다.
- **회귀.** `npm --prefix landing run test:e2e:prod -- tests/e2e/how.spec.ts`.
  - `panel.getByRole('button', { name: 'INNER JOIN' })` → `aria-pressed=true` → `LEFT JOIN` → `다음 단계: 경험 카드`.
  - 알림: `다음 알림` → `다음 알림 보기` → `30일 알림 열기` → `처음 알림부터 다시`.

## Gotchas

- 히어로 데모가 재생 중일 때 섹션 4로 바로 점프하면 히어로가 일시정지된다. 정상 동작이다.
- 알림 앞 장(`.notif[data-off="0"]`)의 버튼은 `hidden` 속성으로 바뀐다. `.n-hit:not([hidden])`으로 고른다.
- JS 없음에서는 탭 없이 4단계가 세로로 모두 보인다. `no-js.md`를 본다.
