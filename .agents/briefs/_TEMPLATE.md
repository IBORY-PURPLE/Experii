# <작업 제목>

<!--
Chief of Staff가 Linear 이슈 본문으로 채우는 브리프 템플릿이다. 로컬 레인(spawn.ps1)은 이 파일을 복사해 .agents/briefs/<slug>.md로 쓴다.
이 브리프가 에이전트의 계약이다. 비어 있는 칸이 하나라도 있으면 승인 요청을 보내지 않는다.
-->

## 목표
<한 문장. PRD.md 색인 기준 어느 영역(landing/ 또는 skill/)의 어떤 항목인지 적는다>

## kind
<`.agents/unattended.md`의 kind 중 하나. 예: landing-bugfix. 처음 보는 종류면 새 kind 이름을 제안하고, 이 일감은 지켜보는 실행으로 돌린다>

## 완료 조건 (done means)
<!-- 에이전트가 매 반복마다 직접 돌려서 통과/실패를 판정할 수 있는 것만 쓴다. "4시간 작업" 같은 기간은 완료 조건이 아니다 -->
- [ ] `node scripts/agents/gates.mjs` 통과 (typecheck, unit, build, bundle, prod E2E)
- [ ] <이 일감에만 해당하는 검사. 예: 1440×770에서 히어로가 스크롤 없이 `data-play="ended"`까지 재생>
- [ ] UI가 바뀌면 `verify-landing` 증거(바뀐 기능의 전후)를 `publish-evidence.mjs`로 올림

## 범위
- 건드려도 되는 파일: <경로>
- 건드리면 안 되는 파일: 보호 경로(`.agents/`, `.claude/`, `.github/`, `scripts/agents/`, `landing/playwright.config.ts`, `CLAUDE.md`, `AGENTS.md`, `PRD.md`), PRD·TSD 문서, 다른 진행 중 일감의 파일

## 권한
- 클라우드 레인: `claude/son-<n>` 브랜치에 반복마다 커밋·push, PR 열기(ready). main push·병합·브랜치 삭제는 하지 않는다
- 로컬 레인: 이 worktree 브랜치에 커밋만. push·PR·병합은 하지 않는다

## 탈출구
- 같은 검사가 3회 연속 실패하면 멈춘다. 시도한 것과 이유를 Linear 댓글(로컬은 `.audit/<slug>.tsv`와 `BLOCKED.md`)에 남기고 `agent:blocked`를 붙인다
- 창업자 판단이 필요하면 `[ask SON-n]`으로 묻고 `needs:founder`를 붙인 뒤 이 일감을 끝낸다
- 완료 조건을 완화해서 끝내지 않는다

## 출처
- 인입: <Slack 채널 ID> / <원글 ts> / <permalink>
- 브리프 글: <봇의 [cos:brief] 글 ts> (승인 ✅는 이 글에 단다)
