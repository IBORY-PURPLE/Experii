# 사전 신청 폼

방문자가 이메일과 몇 가지 칩(학생 여부, SQLD 상태, 유료 AI 구독)을 고르고 동의한 뒤 `사전 신청하기`를 누르면 "신청됐어요." 완료 화면이 나온다. 지금은 dry-run이라 저장소에 쓰지 않는다.

## Sub-features

- `su-required` 비우고 제출하면 필드별 오류 5개가 뜨고 `#f-email`에 포커스가 간다.
- `su-keep` 동의만 빼고 제출하면 오류는 동의 1개뿐이고, 고른 칩과 이메일이 그대로 남는다.
- `su-done` 모두 채우고 제출하면 "신청됐어요."가 보이고 `.su-done`에 포커스가 간다.
- `su-utm` URL의 `utm_source`·`utm_medium`·`utm_campaign`이 숨은 필드에 들어간다.
- `su-exclusive` `유료 구독 없음`을 고르면 다른 구독 칩이 풀린다.

## How to get to it (user POV)

- 히어로나 헤더의 `사전 신청하기`, 또는 다운로드 안내의 `사전 신청하기`를 누른다.
- `/#signup`으로 바로 들어온다.

## Driving it with Playwright

Preconditions:

- Doctor가 0 또는 2다.
- `SIGNUP_WRITE_ENABLED`가 비어 있다(dry-run).

- **검증과 완료.** `npm --prefix landing run test:e2e:prod -- tests/e2e/landing.spec.ts`. `form.su-form`에서 `getByRole('button', { name: '사전 신청하기' })`, `getByLabel('대학생', { exact: true })`, `getByLabel('지금 공부 중')`, `getByLabel(/만 14세 이상이며/)`을 쓴다. 완료는 `getByText('신청됐어요.')`로 판정한다.
- **쓰기 없음 확인.** 완료 화면만으로는 부족하다. `next start` 로그와 네트워크에 Supabase 쓰기 요청이 없는지 본다.

## Gotchas

- 운영 배포에서 쓰기 플래그가 빠지면 성공처럼 보이지 않고 오류를 낸다. 이것은 의도된 동작이다.
- 칩은 라디오와 체크박스다. JS 없음에서는 `check({ force: true })`가 필요하다.
- 실제 이메일을 넣지 않는다. `@example.test`를 쓴다.
