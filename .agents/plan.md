# Experii 개발 하네스: 상세 실행 계획 (AI용)

2026-10-27 승인. 사람이 본 것은 1쪽 요약이고, 이 파일이 실행 기준이다. 단계를 마칠 때마다 맨 아래 "진행 기록"에 한 줄을 남긴다. 이 계획은 Experii 제품 기능이 아니라 Experii를 개발하는 방식(하네스)에 관한 것이다.

## 원칙

로렌 탄(pstack)의 원칙을 그대로 따른다.

1. 신뢰가 먼저고 병렬은 그다음이다. 사람이 한 번 지켜본 kind만 무인으로 돌린다(`.agents/unattended.md`).
2. 완료 조건은 명령으로 통과/실패를 판정할 수 있어야 한다. 기간은 완료 조건이 아니다.
3. 에이전트는 사람을 기다리며 서지 않는다. 물어볼 것은 폰 채널에 남기고 그 일감만 멈춘 뒤 다른 일을 한다.
4. 판정하는 세션은 코드를 쓴 세션이 아니다. verifier는 main에서 뜬다.
5. 병합·배포는 사람만 한다. main push·병합·브랜치 삭제는 가드 훅으로 막는다.
6. 운영 지시는 레포 파일(`.agents/routines/*.md`)에 둔다. 예약 작업에 저장하는 프롬프트는 "이 파일을 읽고 따른다" 한 줄이다.

## 확인된 사실 (2026-10-27)

| 사실 | 설계에 주는 영향 |
|---|---|
| 클라우드 예약 작업 트리거는 일정(최소 1시간)·API·GitHub 이벤트뿐이다. Slack·Linear 트리거는 없다 | 인입은 일정으로 읽는다. 즉시 시작은 Claude 앱 "지금 실행"이나 Slack `@Claude`로 한다 |
| 예약 작업과 클라우드 세션은 사용자 이름으로 Slack·Linear·GitHub에 쓴다 | 폰 알림과 승인 구분을 위해 별도 봇 토큰(네트워크 비밀값)을 쓴다 |
| 클라우드 세션은 레포·사용자 설정의 플러그인을 설치하지 않는다. `~/.claude`도 읽지 않는다 | pstack을 `.agents/pstack/`에 복사하고 경로로 읽는다. 모델 역할은 `.claude/rules/`에 둔다 |
| 클라우드 GitHub 프록시는 GraphQL을 막는다 | `gh pr`·`gh issue`는 쓸 수 없다. `gh api` REST만 쓴다. REST로는 draft를 풀 수 없으니 PR은 ready로 연다 |
| 기본 허용 목록에 Playwright CDN이 없다. 설정 스크립트는 5분 안에 끝나야 캐시된다 | 환경 Network를 Custom으로 바꾸고 Playwright CDN을 허용한다 |
| 네트워크 비밀값은 `api.anthropic.com`에 붙지 않는다 | 예약 작업끼리 `/fire`로 부르지 않는다 |
| 클라우드에서는 `CLAUDE_CODE_REMOTE=true`, 세션 ID는 `CLAUDE_CODE_REMOTE_SESSION_ID`로 알 수 있다 | 훅과 규칙을 클라우드에서만 켠다 |
| Linear SON에는 In Review 상태가 없다. 라벨은 Bug·Feature·Improvement 3개다 | 상태와 라벨을 추가한다 |
| 이 PC의 `slack` 명령은 Slack 데스크톱 앱이다 | Slack CLI를 깔 때는 `-Alias slackcli`를 쓴다 |
| `shots.sh`는 로컬 gstack browse에 묶여 있다 | 장면을 Playwright evidence 스펙으로 옮긴다 |

## 구성

| 층 | 구성 요소 | 위치 |
|---|---|---|
| 일 정하기 | Chief of Staff 예약 작업 | `.agents/routines/chief-of-staff.md` |
| 일 정하기 | 폰 채널 설정(채널 ID, 창업자 ID, 표식) | `.agents/hitl.md` |
| 일 정하기 | 일감 장부 | Linear SON, 프로젝트 "Experii" |
| 코딩 | implementer 예약 작업 | `.agents/routines/implementer.md` |
| 코딩 | 브리프 템플릿 | `.agents/briefs/_TEMPLATE.md` |
| 코딩 | 무인 허용 kind 목록 | `.agents/unattended.md` |
| 검증 | 게이트 | `scripts/agents/gates.mjs` → `gates.json` |
| 검증 | 증거 촬영 | `landing/tests/evidence/journeys.spec.ts`, `npm run evidence` |
| 검증 | 판정 스킬 | `.claude/skills/verify-landing/` |
| 검증 | 증거 게시 | `scripts/agents/publish-evidence.mjs` |
| 검증 | verifier 예약 작업 | `.agents/routines/verifier.md` |
| 검증 | CI | `.github/workflows/landing-ci.yml` |
| 공통 | pstack 사본 | `.agents/pstack/` (+ `VERSION`, `scripts/agents/sync-pstack.ps1`) |
| 공통 | 클라우드 규칙 | `.claude/rules/cloud.md`, `.claude/rules/pstack-models.md` |
| 공통 | 훅 | `scripts/agents/session-start.mjs`, `scripts/agents/guard.mjs` (`.claude/settings.json`에 연결) |

## 폰 채널 (HITL) 규약

- **채널**: 학교 Slack 워크스페이스에 봇을 관리자 승인 없이 설치할 수 있으면 Slack을 쓴다. 승인이 필요하면 Discord(창업자 소유 서버)를 쓴다. 승인 요청은 보내지 않는다.
- **봇 계정**: 에이전트의 글은 모두 봇 토큰으로 보낸다. 토큰은 클라우드 환경 `experii`의 네트워크 비밀값에 사람이 넣는다.
  - Slack: 호스트 `slack.com`, 헤더 `Authorization: Bearer`.
  - Discord: 호스트 `discord.com`, 헤더 `Authorization`, 접두사 `Bot`.
  - 에이전트는 토큰 값을 보지 않는다.
- **채널 구성**: 인입(`#experii-inbox`, 창업자만 글을 씀)과 운영(`#experii-ops`, 아침 요약). 채널 ID와 창업자 사용자 ID는 `.agents/hitl.md`에 둔다(비밀값 아님).
- **표식**: 봇 글은 첫 줄에 표식을 단다. `[cos:brief SON-n]`, `[cos:dup SON-n]`, `[cos:out-of-scope]`, `[ask SON-n]`, `[impl:pr SON-n]`, `[verify:pass SON-n]`, `[verify:fail SON-n]`, `[digest]`.
- **승인**: 창업자 글의 스레드에 봇이 브리프 요약(목표, 완료 조건, 범위, kind)을 단다. 그 봇 글에 **창업자 ID가 단 ✅**만 승인으로 친다. ❌는 기각이다. 창업자가 스레드에 답글을 달면 수정 요청으로 보고, 브리프를 고친 뒤 새 요약을 단다. 이때 승인은 다시 받는다.
- **질문**: 막히면 `[ask SON-n]` 글로 창업자를 @멘션한다. Linear에는 `needs:founder`를 붙인다. 그 일감만 멈추고(`wip:` 커밋) 다른 일을 한다.
- **즉시 실행**: 승인한 일감을 지금 돌리고 싶으면 창업자가 Claude 앱에서 `experii-implementer`의 "지금 실행"을 누른다. Slack이고 Claude 앱이 설치돼 있으면 스레드에서 `@Claude implementer SON-n`으로도 된다.
- **판정 결과**: verifier가 PR 댓글을 남기고, CoS가 원래 스레드에 결과와 PR 링크를 단다. 병합은 창업자가 GitHub 앱에서 한다.

## 역할별 규칙

운영 파일은 3단계에서 만든다. 아래가 그 내용의 기준이다.

### chief-of-staff (일정 `CRON_TZ=Asia/Seoul 7 9-22 * * *`, 커넥터 Linear, 봇 토큰)

1. 읽기: `PRD.md` 색인, `.agents/hitl.md`, `.agents/unattended.md`, `.agents/briefs/_TEMPLATE.md`.
2. 인입: 인입 채널에서 봇 표식 답이 없는 창업자 최상위 글만 읽는다. 스레드 답글은 일감으로 만들지 않는다.
3. 분류: 버그·기능·질문·기타. `PRD.md` 범위 밖이면 `[cos:out-of-scope]`로 답하고 이슈는 만들지 않는다.
4. 중복: 프로젝트 Experii에서 Slack(또는 Discord) permalink와 제목으로 찾는다. 같은 일감이 있으면 그 이슈에 댓글을 달고 `[cos:dup SON-n]`으로 답한다.
5. 새 일감: Backlog 이슈를 만든다. 본문에는 템플릿에 맞춘 브리프, 출처 좌표(채널 ID, 글 ts), kind 라벨, `source:inbox`가 들어간다.
   - 완료 조건이 명령으로 판정되고 파일 범위가 정해졌으면 Todo로 옮기고 `[cos:brief SON-n]` 요약을 단다.
   - 아니면 `[ask SON-n]`으로 묻고 `needs:founder`를 붙인다.
6. 승인 처리: Todo 이슈의 브리프 글을 읽는다. 창업자 ✅이면 `agent:ready`, ❌이면 Canceled로 바꾼다. 창업자 답글이 있으면 브리프를 고친다.
7. 상태 전달: PR 열림·판정·차단처럼 바뀐 상태를 원래 스레드에 1회 알린다.
8. 09:07 회차: 운영 채널에 `[digest]` 1개를 올린다. 내용은 밤사이 PR과 판정, 막힌 것, 창업자 답을 기다리는 것, 승인 대기 수, `.agents/pstack/VERSION`이다.
9. 금지: 코드 수정, git push, ✅ 없이 `agent:ready` 붙이기(`.agents/unattended.md`의 `auto_promote` 목록은 처음엔 비어 있다), 인입 채널에 최상위 글 쓰기.

### implementer (일정 `CRON_TZ=Asia/Seoul 7 23 * * *`, 5단계에서 `7 23,0`, 커넥터 Linear, 봇 토큰)

1. 한 번 실행에 일감 하나만 한다.
2. 우선순위 ①: 열린 PR 중 `verify:fail`이고 판정 댓글이 3개 미만인 것을 고친다. 그 브랜치를 받아 판정 댓글을 근거로 고치고 push한 뒤 `verify:pending`으로 바꾼다.
3. 우선순위 ②: Linear에서 `agent:ready`이고 Todo이고, kind가 `.agents/unattended.md`에 있는 이슈. 우선순위 높은 것, 오래된 것 순이다.
4. 선점: main 위에 빈 claim 커밋을 만들고 `git push origin HEAD:refs/heads/claude/son-<n>`(강제 없음)을 한다.
   - 거부되면 다른 세션이 먼저 잡은 것이다. 다음 후보로 넘어간다.
   - 성공하면 Linear를 In Progress로 바꾸고 세션 URL 댓글을 단다.
5. 작업:
   - `.agents/pstack/docs/harness/claude-code.md`와 `.agents/pstack/skills/poteto-mode/SKILL.md`를 읽고 따른다. 하위 에이전트에는 SKILL.md 절대 경로를 넘긴다.
   - 브리프를 계약으로 삼아 bug-fix 또는 feature 플레이북을 따른다. 반복마다 커밋한다.
   - `node scripts/agents/gates.mjs`를 돌린다.
   - UI가 바뀌면 `verify-landing`으로 증거를 찍는다. 버그는 main 빌드에서 수정 전을, 브랜치 빌드에서 수정 후를 찍는다.
   - `publish-evidence.mjs`로 증거를 올린다.
6. PR: `gh api repos/IBORY-PURPLE/Experii/pulls`로 연다(ready).
   - 본문: opening-a-pr 형식(Why/What changed/Scope/Blast Radius/Verification), 완료 조건 표, 증거 이미지, `Fixes SON-n`.
   - 라벨 `verify:pending`을 붙인다. Linear에 PR 링크 댓글을 단다.
7. 질문이 생기면 `[ask SON-n]` + `needs:founder`를 남기고 `wip:` 커밋을 push한 뒤 이 일감을 끝낸다. 되돌릴 수 있는 사소한 가정이면 PR 본문에 적고 계속 간다.
8. 같은 검사가 3회 연속 실패하면 `agent:blocked`를 붙이고 시도한 것과 이유를 댓글로 남긴다. `wip:` 커밋을 push하고 멈춘다. 완료 조건은 완화하지 않는다.
9. 금지: main push, 병합, 강제 push, 브랜치 삭제, 보호 경로(`.agents/`·`.claude/`·`.github/`·`scripts/agents/`·`landing/playwright.config.ts`·`CLAUDE.md`·`AGENTS.md`·`PRD.md`) 수정, `package.json` 의존성 변경(브리프가 허용한 경우 제외).

### verifier (일정 `CRON_TZ=Asia/Seoul 7 5,7 * * *`, 커넥터 Linear, 봇 토큰)

1. main을 클론한 상태에서 판정 지시·훅·스킬을 쓴다. PR 코드는 `git worktree add`로만 받는다.
2. 대상: 열린 `claude/son-*` PR 중 `verify:pending`이거나 마지막 판정 이후 새 커밋이 있는 것.
3. 바로 fail: 보호 경로를 바꿨거나 기존 테스트의 assert를 지운 PR.
4. 재판정: Linear의 승인된 브리프를 읽고 worktree에서 게이트를 직접 돌린다. 바뀐 기능을 `verify-landing`으로 직접 재현한다. 버그는 main에서 재현되고 PR에서 사라지는지 확인한다.
5. 구현자의 스크린샷과 자기 보고는 증거로 치지 않는다. 자기 증거만 올린다(`claude/ev-son-<n>-verify-<sha7>`).
6. head SHA당 판정 댓글은 1개다. 완료 조건별 결과 표와 증거를 넣고, 라벨을 `verify:pass` 또는 `verify:fail`로 바꾼다.
7. 같은 PR에서 판정 fail이 3회면 `needs:founder`를 붙인다.
8. 금지: 코드 push(증거 브랜치 제외), 병합, 승인 리뷰.

## 클라우드 환경 `experii` (사람이 claude.ai/code에서 만든다)

- Network: Custom. "Also include default list"를 켜고, `cdn.playwright.dev`, `playwright.download.prss.microsoft.com`, `playwright.azureedge.net`을 추가한다.
- 환경 변수(비밀값 아님):
  - `GIT_AUTHOR_NAME=Claude`, `GIT_AUTHOR_EMAIL=noreply@anthropic.com`
  - `NEXT_TELEMETRY_DISABLED=1`
  - `PLAYWRIGHT_BROWSERS_PATH=/opt/pw`
  - `BASH_DEFAULT_TIMEOUT_MS=1200000`, `BASH_MAX_TIMEOUT_MS=1800000` (prod E2E가 12~14분 걸린다)
- 네트워크 비밀값: 봇 토큰 1개(위 "봇 계정" 참고).
- 설정 스크립트:
  ```bash
  #!/bin/bash
  export PLAYWRIGHT_BROWSERS_PATH=/opt/pw
  npx -y playwright@1.64.1 install --with-deps chromium
  apt-get install -y ffmpeg || true
  ```
  Playwright 버전은 `landing/package.json`과 맞춘다. 올릴 때는 두 곳을 같이 바꾼다.
- 예약 작업 3개 모두 이 환경을 쓴다. 각 작업에서 Linear 외의 커넥터는 뺀다. 모델은 Opus이고, 사용량이 부담되면 CoS부터 Sonnet으로 내린다.

## 단계

👤 = 사람만 할 수 있는 계정·UI 작업.

### 0단계: 기반

1. 채널 확정: 👤 내장 브라우저에서 api.slack.com에 로그인한다. Claude가 `.agents/hitl/slack-manifest.yaml`로 앱을 만들고 Install App 버튼 문구를 읽는다.
   - "Install to …"이면 Slack으로 간다. 👤 설치를 누른다.
   - "Request to Install"이면 누르지 않는다. 시험 앱은 지우고 Discord로 간다.
2. 랜딩: 미커밋 수정 4개(`Difference` 타임라인 화살표 3파일, `mock.css` 캐럿)를 👤 확인받아 커밋한다. 게이트를 돌리고, main을 `landing-overnight`로 fast-forward한 뒤 push한다.
3. `PRD.md` 색인을 만든다. CLAUDE.md "병렬 에이전트 작업" 절을 고쳐 클라우드 레인의 `claude/*` push·PR을 허용하고, 이 파일과 `cloud.md`를 가리키게 한다.
4. pstack 사본:
   - `harness/pstack/claude-code/`를 `.agents/pstack/`에 복사하고 `VERSION`과 `sync-pstack.ps1`을 둔다.
   - `.claude/agents/`에 `poteto-agent.md`·`comment-sicko.md`를 둔다.
   - `.claude/rules/pstack-models.md`를 둔다.
   - `.claude/settings.json`에 `attribution.commit`을 넣는다.
5. Linear:
   - 프로젝트 Experii와 라벨(`agent:ready`, `agent:blocked`, `needs:founder`, `source:inbox`, `kind:landing-bugfix`)을 만든다.
   - 👤 In Review 상태를 추가하고 GitHub 연동을 켠다.
   - GitHub 라벨 `verify:pending|pass|fail`을 만든다.

완료: `git status --porcelain` 출력 없음, `git rev-parse main` = `git ls-remote origin main`, `claude -p`가 PRD 색인으로 랜딩 기준 문서를 맞게 답함, Linear 라벨·프로젝트 존재.

### 1단계: 판정 장치 (로컬)

1. `gates.mjs`: typecheck → vitest → build → check:bundle → `test:e2e:prod`를 돌려 `gates.json`(단계별 결과, 통과·실패 수)과 종료 코드를 남긴다.
2. `playwright.config.ts`:
   - 채널 기본값은 `PW_CHANNEL`이 있으면 그 값, CI·클라우드는 번들 chromium, Windows는 msedge다.
   - `evidence` 프로젝트를 추가한다. 동작 줄이기는 끄고 video는 켠다. `npm run evidence`로만 돈다.
3. `journeys.spec.ts`: `shots.sh`의 장면(히어로 단계별, 섹션 4, 다운로드 안내)을 옮긴다. 결과는 `landing/reports/evidence/<ID>/`(gitignore)에 PNG·webm·GIF·`manifest.json`으로 남는다.
4. `/poteto-mode` + `create-verification-skill`로 `.claude/skills/verify-landing/`을 만든다.
   - Launch: :3100 prod.
   - Doctor: `nextjs-portal` 없음, BUILD_ID 확인.
   - 기능 지도: 히어로 데모, 다운로드 가짜 문, 섹션 4 체험, 사전 신청 dry-run, JS 없음.
5. `publish-evidence.mjs <ID> <dir>`: git plumbing으로 고아 커밋을 만들어 `claude/ev-son-<n>-<impl|verify-sha7>`에 push하고, SHA를 고정한 `blob/<sha>/…?raw=true` Markdown을 출력한다.
6. `landing-ci.yml`: PR과 main push에서 `gates.mjs`를 돌린다. 새 push가 오면 이전 실행을 취소한다.

완료:
- `gates.mjs` 종료 코드 0.
- `npm run evidence`가 PNG 12장 이상과 webm 1개를 만든다.
- **변이 시험**: 창 높이 761~778px 사각지대를 verify-landing이 main에서 FAIL로 재현한다.
- 시험 PR의 CI가 녹색이다.

### 2단계: 클라우드 동일성

1. 👤 클라우드 환경 `experii`를 만들고(값은 위 절), GitHub 연결(App 또는 `/web-setup`)을 확인한다. claude.ai 커넥터에서 Linear를 연결한다.
2. `session-start.mjs`: 클라우드에서만 `npm ci --prefix landing`을 돌리고, Playwright 버전이 lock과 다르면 실패시킨다.
3. `guard.mjs`(PreToolUse, 클라우드에서만):
   - push 대상은 `claude/*`만 허용한다.
   - 강제 push와 ref 삭제, `…/merge` REST, `gh pr merge`를 막는다.
4. `.claude/rules/cloud.md`: pstack 경로, REST 전용, PR ready, 증거 없는 UI PR 금지, `/loop` 생략.
5. 탐침: 이 앱에서 환경 `experii`로 클라우드 세션을 띄운다.
   - `node -v`, `gates.mjs`, `npm run evidence`, `publish-evidence.mjs`를 돌린다.
   - 시험 PR을 열었다가 닫는다.
   - main push와 merge를 일부러 시도한다.
6. (선택, 그때 묻는다) main 보호: PR과 CI 필수, 관리자 포함.

완료:
- 클라우드 `gates.json` 통과 수가 로컬과 같다(230/0).
- 시험 PR 이미지가 렌더된다(👤 확인).
- 커밋 작성자가 `Claude <noreply@anthropic.com>`이고 attribution과 `Claude-Session:` 트레일러가 붙는다.
- 금지 조작 2건이 가드에 막힌다.

### 3단계: 폰 채널과 Chief of Staff

1. 👤 인입·운영 채널을 만들고 봇을 초대한다. 봇 토큰을 환경 비밀값에 넣는다.
2. `.agents/hitl.md`에 채널 ID와 창업자 ID를 적는다. `.agents/routines/chief-of-staff.md`와 `.agents/unattended.md`(빈 목록, `auto_promote: []`)를 만든다. `_TEMPLATE.md`를 Linear 본문용으로 고친다(출처 좌표, kind, 증거 요구).
3. `/schedule`로 `experii-chief-of-staff`를 만든다. 일정은 꺼 두고 Run now로 시험한다.

완료: 시험 글 5개(버그 2개 중 1개는 기존 이슈와 중복, 기능 1, 질문 1, 스레드 답글 1)를 넣고 돌리면 다음이 나온다.
- 새 이슈 2개와 중복 처리 1개가 생긴다.
- 최상위 글마다 봇 답이 정확히 1개 달린다.
- 스레드 답글에는 반응하지 않는다.
- 다시 돌리면 새 이슈와 새 답이 0개다.
- 폰에서 ✅를 누르면 다음 회차에 `agent:ready`가 붙는다.

### 4단계: 지켜보는 1회

1. 창 높이 761~778px 사각지대를 인입 채널에 글로 넣는다. CoS가 브리프를 단다. 👤 폰에서 ✅를 누른다.
2. `experii-implementer`·`experii-verifier`를 일정 꺼진 상태로 만들고 Run now로 돌린다. 실행 로그는 `RemoteTrigger get_run_log`로 같이 본다.
3. 일부러 고치지 않은 미끼 PR로 verifier가 fail을 내는지 본다.
4. 👤 폰의 GitHub 앱으로 병합한다.

완료:
- 진짜 PR은 `verify:pass`, 미끼 PR은 `verify:fail`.
- Linear가 Done이 된다.
- `unattended.md`에 `landing-bugfix`가 세션 URL·PR 링크와 함께 들어간다.

### 5단계: 무인 운영

- implementer `7 23`, verifier `7 5,7`, CoS `7 9-22` 일정을 켠다.
- 사흘 밤 연속으로 08시 전에 판정과 증거가 붙은 PR이 오면 implementer를 `7 23,0`(2레인)으로 늘린다.
- 3레인은 2주 동안 가드 차단 0일 때만 연다.
- 주 1회 `/correct`·`/reflect`로 반복 실패를 운영 파일·템플릿·verify 스킬에 넣는다.
- `.agents/README.md`를 새 구조로 다시 쓴다. 쓰인 적 없는 `.agents/chief-of-staff.md`는 지운다.
- `spawn.ps1`은 Windows에서만 확인할 수 있는 일(Pre-MVP M0·M4)용으로 남긴다.

## 범위 밖

- 에이전트의 병합·배포.
- X 수집: 출시 후에 한다.
- 카톡 양방향: 별도 서버가 필요하다.
- Auto-fix: 판정 댓글과 맞물려 계속 돌 수 있다.
- Claude Projects.
- 서드파티 Linear 러너.
- 클라우드에서 Codex 교차 리뷰.
- Windows CI 잡, Pre-MVP 스킬용 verify·CI: `skill/` 코드가 생기면 한다.
- evidence 브랜치 자동 정리.
- 3레인 이상(조건 충족 전).

## 위험

| 위험 | 대응 |
|---|---|
| Linux chromium과 Windows Edge 결과 차이 | 2단계 완료 조건으로 잡는다. 테스트를 약하게 고치지 않는다 |
| Slack·Discord 글에 섞인 지시 | 인입은 창업자만 쓰는 채널로 둔다. CoS는 코드를 만지지 않는다. implementer는 승인된 Linear 브리프만 계약으로 따른다 |
| 봇이 사용자 이름으로 Linear 승인 라벨을 붙일 수 있다 | 승인은 창업자 ✅만 인정한다. implementer는 main의 `unattended.md`에 있는 kind만 받는다. 마지막 관문은 판정과 사람의 병합이다 |
| 예약 작업은 research preview다 | 운영 파일은 레포에 두고 저장 프롬프트는 한 줄로 둔다 |
| 사용량 한도 | 1레인으로 시작하고 일감을 작게 잡는다. CoS는 Sonnet으로 내릴 수 있다 |
| pstack 사본이 원본과 어긋남 | `sync-pstack.ps1`로 맞추고, 아침 요약에서 버전을 표시한다 |
| 학교 워크스페이스 관리자가 봇을 지울 수 있음 | 그때 Discord로 옮긴다. 채널 규약은 같다 |
| `~/.claude/settings.json`에 평문 API 키가 있음 | 레포나 클라우드 환경으로 옮기지 않는다 |

## 진행 기록

| 날짜 | 단계 | 결과 | 근거 |
|---|---|---|---|
| 2026-10-27 | 계획 | 1쪽 요약 승인, 이 파일 작성 | 이 커밋 |
