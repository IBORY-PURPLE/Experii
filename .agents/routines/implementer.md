# implementer 운영 지침

예약 작업 `experii-implementer`가 실행마다 이 파일을 읽는다. 일정은 `CRON_TZ=Asia/Seoul 7 23 * * *`이고, 5단계에서 `7 23,0`이 된다. 창업자가 Claude 앱에서 "지금 실행"으로 띄우기도 한다. **한 번 실행에 일감 하나만 한다.**

## 먼저 읽기

`.claude/rules/cloud.md`, `.agents/pstack/docs/harness/claude-code.md`, `.agents/pstack/skills/poteto-mode/SKILL.md`(전부), `PRD.md`, `.agents/unattended.md`, `.agents/hitl.md`, `.claude/skills/verify-landing/SKILL.md`.

## 일감 고르기

1. **고치기 먼저**: 열린 PR 중 head가 `claude/son-`로 시작하고 `verify:fail` 라벨이 있으며, verifier 판정 댓글(`[verify:fail`)이 3개 미만인 가장 오래된 것을 고른다.
   - 그 브랜치를 받아 판정 댓글이 짚은 결함만 고친다.
   - push한 뒤 라벨을 `verify:pending`으로 바꾸고 끝낸다.
2. **새 일감**: Linear 프로젝트 Experii에서 Todo이고 `agent:ready`가 붙어 있으며, `kind:*`가 `.agents/unattended.md` 표에 있는 이슈를 고른다. 우선순위가 높은 것, 오래된 것 순이다. 표에 없는 kind는 건너뛴다(지켜보는 실행 전용).
   - 지켜보는 실행이면 창업자가 이슈 번호를 지정한다. 이때는 kind 검사를 건너뛴다.
3. **선점**:
   ```bash
   git checkout -B claude/son-<n> origin/main
   git commit --allow-empty -m "Claim SON-<n>"
   git push origin HEAD:refs/heads/claude/son-<n>
   ```
   - push가 거부되면 다른 세션이 먼저 잡은 것이다. 다음 후보로 넘어간다.
   - 성공하면 Linear를 In Progress로 바꾸고, 세션 링크를 댓글로 단다.
4. 할 일이 없으면 아무것도 쓰지 않고 끝낸다.

## 작업

- 브리프(Linear 본문)가 계약이다. poteto-mode를 따라 bug-fix 또는 feature 플레이북으로 간다. 하위 에이전트에는 poteto-mode SKILL.md의 절대 경로를 넘긴다.
- 반복마다 작은 커밋을 하고 `git push origin HEAD:refs/heads/claude/son-<n>`을 한다.
- 커밋 작성자는 환경 변수(`GIT_AUTHOR_*`)를 따른다. 메시지 끝에는 `.claude/settings.json`의 `attribution.commit`을 붙인다.
- 검사: `node scripts/agents/gates.mjs`를 백그라운드로 돌린다(12~14분). 결과는 `landing/test-results/gates.json`이다.
- UI가 바뀌면:
  - 버그는 수정 전 main 빌드와 수정 후 빌드에서 각각 `verify-landing`으로 찍는다. ID는 `SON-<n>-before`·`SON-<n>`이다.
  - 기능은 수정 후만 찍는다.
  - `node scripts/agents/publish-evidence.mjs SON-<n> landing/reports/evidence/SON-<n>`으로 올린다.

## PR

- `gh api repos/IBORY-PURPLE/Experii/pulls`로 연다. ready로 열고, base는 main이다.
  - 제목: 영어 문장형 한 줄. 레포의 기존 커밋과 같은 방식이다.
  - 본문(`.agents/pstack/skills/poteto-mode/playbooks/opening-a-pr.md` 형식):
    - `## Why`, `## What changed`, `## Scope`, `## Blast Radius`, `## Verification`.
    - Verification에는 완료 조건별 결과 표(명령, 결과)를 넣는다.
    - 그 뒤에 증거 Markdown(이미지)과 `Fixes SON-<n>`을 넣는다.
- 라벨 `verify:pending`을 붙인다. Linear에 PR 링크를 댓글로 단다. Slack 알림은 Chief of Staff가 한다.

## 막혔을 때

- **창업자 판단이 필요하면**: 원글 스레드에 `[ask SON-<n>]`으로 창업자를 @멘션해 묻는다.
  - Slack 좌표는 이슈 본문의 출처에 있다.
  - `needs:founder`를 붙이고 `wip:` 커밋을 push한 뒤 이 일감을 끝낸다.
  - 되돌릴 수 있는 사소한 가정이면 묻지 말고 PR 본문 Scope에 적는다.
- **같은 검사가 3회 연속 실패하면**: `agent:blocked`를 붙이고, 시도한 것과 이유를 Linear 댓글로 남긴다. `wip:` 커밋을 push하고 멈춘다.
- 완료 조건을 완화하지 않는다.

## 금지

- main push, 병합, 강제 push, 브랜치 삭제. 가드 훅이 막는다.
- 보호 경로 수정: `.agents/`, `.claude/`, `.github/`, `scripts/agents/`, `landing/playwright.config.ts`, `CLAUDE.md`, `AGENTS.md`, `PRD.md`.
- `package.json` 의존성 변경. 브리프가 허용한 경우만 예외다.
- PRD 범위 밖 기능.
