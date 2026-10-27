# 클라우드 세션 규칙

이 규칙은 클라우드 세션(`CLAUDE_CODE_REMOTE=true`: 예약 작업 실행과 claude.ai/code 세션)에만 적용한다. 로컬 세션은 이 파일을 무시한다. 하네스 전체 계획은 `.agents/plan.md`다.

- **pstack**: 플러그인으로 설치돼 있지 않다.
  - `<pstack>`은 `.agents/pstack`이다. 먼저 `.agents/pstack/docs/harness/claude-code.md`를 읽는다.
  - 스킬은 `.agents/pstack/skills/<이름>/SKILL.md`를 읽고 따른다.
  - 하위 에이전트는 `pstack:poteto-agent` 대신 `poteto-agent`를 쓰고, 프롬프트에 poteto-mode SKILL.md의 절대 경로를 넣는다(`echo "$PWD/.agents/pstack/skills/poteto-mode/SKILL.md"`).
- **GitHub는 REST로만 쓴다.** 프록시가 GraphQL을 막아서 `gh pr`과 `gh issue`는 실패한다.
  - PR 열기: `gh api repos/IBORY-PURPLE/Experii/pulls -f title='…' -f head=claude/son-<n> -f base=main -F body=@pr.md`
  - 라벨: `gh api repos/IBORY-PURPLE/Experii/issues/<번호>/labels -f 'labels[]=verify:pending'`
  - 댓글: `gh api repos/IBORY-PURPLE/Experii/issues/<번호>/comments -F body=@comment.md`
  - PR은 ready로 연다. REST로는 draft를 풀 수 없다.
- **push**: `claude/*` 브랜치에만 하고, 대상을 명시한다(`git push origin HEAD:refs/heads/claude/son-<n>`). main push, 병합, 강제 push, 브랜치 삭제는 가드 훅(`scripts/agents/guard.mjs`)이 막는다.
- **증거**: UI를 바꾼 PR은 `verify-landing` 증거와 `node scripts/agents/publish-evidence.mjs` 출력 없이 열지 않는다.
- **게이트**: `node scripts/agents/gates.mjs`. prod E2E가 12~14분 걸리니 백그라운드로 돌리고 끝날 때까지 기다린다.
- **한 번에 일감 하나**: `/loop`은 쓰지 않는다. 예약 작업 한 번이 일감 하나다.
- **폰 채널**: `.agents/hitl.md`를 따른다. 봇 토큰은 프록시가 붙이므로 토큰을 출력하거나 파일에 쓰지 않는다.
- **세션 링크**: `echo "https://claude.ai/code/${CLAUDE_CODE_REMOTE_SESSION_ID/#cse_/session_}"`. Linear 댓글과 Slack 글에 붙인다.
