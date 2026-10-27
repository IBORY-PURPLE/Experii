# verifier 운영 지침

예약 작업 `experii-verifier`가 실행마다 이 파일을 읽는다. 일정은 `CRON_TZ=Asia/Seoul 7 5,7 * * *`이고, "지금 실행"으로도 띄운다. 이 역할은 코드를 쓴 세션이 아니다. 판정 지시와 훅과 스킬은 지금 클론된 main의 것을 쓰고, PR 코드는 worktree로만 받는다.

## 먼저 읽기

`.claude/rules/cloud.md`, `.claude/skills/verify-landing/SKILL.md`와 `features/`, `.agents/pstack/skills/principle-prove-it-works/SKILL.md`.

## 대상

열린 PR 중 head가 `claude/son-`로 시작하고, 다음 중 하나에 해당하는 것이다.
- `verify:pending` 라벨이 있다.
- 마지막 판정 댓글의 sha 이후에 새 커밋이 있다.

오래된 것부터 판정한다. PR이 여럿이면 PR마다 하위 에이전트를 하나씩 띄워도 된다.

## PR마다

1. **받기**: `git fetch origin claude/son-<n> && git worktree add ../pr-<n> FETCH_HEAD`. head sha 7자리를 적어 둔다.
2. **바로 fail**: `git diff --name-only origin/main...FETCH_HEAD`에 다음이 있으면 재판정하지 않고 fail로 판정한다.
   - 보호 경로를 바꿨다: `.agents/`, `.claude/`, `.github/`, `scripts/agents/`, `landing/playwright.config.ts`, `CLAUDE.md`, `AGENTS.md`, `PRD.md`.
   - 기존 테스트의 `expect(`나 테스트 케이스를 지웠다.
3. **브리프 읽기**: PR 본문의 `Fixes SON-<n>`으로 Linear 이슈를 찾아 완료 조건과 범위를 읽는다. 범위 밖 파일을 바꿨으면 결함으로 적는다.
4. **직접 재판정**: 구현자의 보고, 스크린샷, `gates.json`은 증거로 치지 않는다.
   - worktree에서 `npm --prefix landing ci`와 `node scripts/agents/gates.mjs`를 돌린다(백그라운드, 12~14분).
   - 이 일감에만 해당하는 완료 조건을 `verify-landing`으로 직접 재현한다.
   - 버그면 main 빌드에서 재현되고(FAIL) PR 빌드에서 사라지는지(PASS) 둘 다 본다.
   - 증거 ID는 `SON-<n>-verify`, 올리기는 `node scripts/agents/publish-evidence.mjs SON-<n> <dir> --role=verify`이다.
5. **결함 판정**: 재현한 결함만 판정에 넣는다. 재현하지 못한 의심은 "관찰" 줄에 따로 적는다.

## 판정 댓글

head sha당 1개만 쓴다. `gh api repos/IBORY-PURPLE/Experii/issues/<번호>/comments`로 단다.

```
[verify:pass SON-<n> sha=<7자리>]  또는  [verify:fail SON-<n> sha=<7자리>]
| 완료 조건 | 명령 | 결과 |
|---|---|---|
...
재현된 결함: (fail일 때, 재현 절차와 증거 링크)
관찰: (재현 못 한 의심, 판정에 넣지 않음)
<증거 Markdown>
```

그다음 라벨을 바꾼다. `verify:pending`을 떼고 `verify:pass` 또는 `verify:fail`을 붙인다. Linear에도 판정 링크를 댓글로 단다.

같은 PR의 fail 판정이 3개째면 Linear에 `needs:founder`를 붙인다. 원글 스레드에 `[ask SON-<n>]`으로 무엇이 반복되는지 알린다.

## 끝

worktree를 지운다(`git worktree remove ../pr-<n> --force`). 증거 폴더는 남긴다.

## 금지

- 코드 push. 예외는 `claude/ev-*` 증거 브랜치뿐이다.
- 병합, 승인 리뷰, PR 닫기.
- 완료 조건을 바꾸거나 완화하기.
