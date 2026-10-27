# 도구 사용 순서

데이터를 읽고 쓰는 작업은 아래 순서로 도구를 고른다. 앞 단계로 되면 뒤 단계로 내려가지 않는다. 내려갈 때는 이유를 한 줄 남긴다(예: "Figma는 CLI가 없어 MCP로 읽었다").

| 순서 | 수단 | 예 |
|---|---|---|
| 1 | CLI | `git`, `gh`, `npm`/`npx`, `node scripts/agents/*.mjs` |
| 2 | API, MCP 커넥터 | Linear, Notion, Figma, Gmail, Slack·GitHub REST(`gh api`) |
| 3 | 브라우저 자동화 | Playwright 하네스, 내장 브라우저 |

## 단계별 규칙

- **1단계**: 이미 로그인된 CLI를 먼저 쓴다. 클라우드 세션의 `gh`는 REST(`gh api`)만 된다(`.claude/rules/cloud.md`).
- **2단계**: CLI가 없거나 필요한 동작이 없을 때 쓴다. 클라우드 예약 작업은 배정된 커넥터(Linear)만 쓴다.
- **3단계**: 1·2단계로 읽거나 쓸 수 없을 때만 쓴다. 메일·문서·이슈 트래커처럼 API가 있는 서비스를 화면 조작으로 읽지 않는다.
  - 3단계 안에서는 `landing/`의 Playwright 하네스(`evidence`, `test:e2e:prod` 스크립트)를 먼저 쓰고, 즉석 확인만 내장 브라우저로 한다.

## 예외: 화면을 검증하는 일

UI 변경이 실제 브라우저에서 맞게 보이고 동작하는지 확인하는 일은 처음부터 3단계다. 화면 자체가 검증 대상이라 CLI나 API로 대신할 수 없다(CLAUDE.md의 UI 변경 규칙, `verify-landing` 스킬).

## 하지 않는 것

- 브라우저 자동화로 로그인, 2단계 인증, CAPTCHA를 넘기려 하지 않는다. 막히면 사람에게 넘긴다.
