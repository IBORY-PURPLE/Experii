# Agent Control Interfaces: 서드파티 하네스가 에이전트 세션을 spawn·관찰·조종·팝아웃·재병합하는 프로그래매틱 표면 (2026-10 기준)

> 검증 환경과 표기 규칙: Windows 11 PC에서 Claude Code 2.1.309(npm 최신 2.1.310), Codex CLI 0.144.5(npm 최신 0.164.0이라 로컬이 약 20 마이너 버전 뒤처짐), Gemini CLI 0.49.0(npm 최신 0.65.0)을 사용했다. `[LOCAL]`은 이 PC에서 2026-10-25에 직접 실행하거나 관찰한 결과라서 URL이 없다. "documented"는 공식 문서에 있는 내용, "undocumented/internal"은 관찰만 된 내부 구현(릴리스마다 깨질 수 있음), "Inferences"는 추론이다. 범위: 프로그래매틱 제어 표면과 팝아웃 아키텍처. 커뮤니티 OSS 도구, OpenAI/Codex 제품 일반, Windows 플랫폼 일반은 다른 노트가 맡는다.

## 1. Claude Code headless(`-p`), 세션 ID, 트랜스크립트 저장, TUI와 headless 동시 접근 위험

### Takeaway
기계가 쓰라고 문서화된 표면은 `claude -p --output-format stream-json [--input-format stream-json]`이다. 세션은 `~/.claude/projects/<인코딩된 cwd>/<session-id>.jsonl`에 저장되고 `--resume <id|이름|.jsonl 경로>`, `--fork-session`, `--session-id`로 이어 쓰거나 분기한다. 같은 세션을 두 프로세스가 동시에 쓰면 트랜스크립트가 섞인다는 점이 문서에 명시돼 있다. 따라서 하네스는 "세션당 writer 하나" 규칙을 직접 강제해야 한다. JSONL 엔트리 형식은 내부 포맷이고 버전마다 바뀐다.

### Cited Findings
- v2.1.309 CLI 플래그(documented, `claude --help`)는 다음과 같다. `-p/--print`, `--output-format text|json|stream-json`, `--input-format text|stream-json`("realtime streaming input", --print 전용), `--include-partial-messages`, `--replay-user-messages`(stream-json 입출력 전용), `--include-hook-events`, `--forward-subagent-text`, `--session-id <uuid>`, `--fork-session`("When resuming, create a new session ID instead of reusing the original"), `-n/--name`, `--no-session-persistence`(--print 전용), `--permission-prompts host|none`, `--agents <json-or-file>`, `--agent`, `--desktop`("Open in the Claude Desktop app instead of the terminal (with --continue or --resume <id>…)"), `--remote-control [name]`, `--bg/--background` — [LOCAL: `claude --help` v2.1.309]
- `json` 출력에는 `result`, `session_id`, `total_cost_usd`가 들어 있다. stream-json 스트림의 마지막 줄은 `result` 메시지다. 첫 이벤트 `system/init`은 model, tools, MCP 서버, 플러그인과 선택 필드 `capabilities` 배열(예: `interrupt_receipt_v1`)을 담는다. 문서는 버전 문자열을 비교하지 말고 이 배열로 기능을 감지하라고 권한다. 재시도할 때는 `system/api_retry` 이벤트가 나온다 — [Run Claude Code programmatically](https://code.claude.com/docs/en/headless)
- 서브에이전트 메시지는 stream에 `assistant`/`user` 메시지로 나오고 `parent_tool_use_id`로 어느 실행 소속인지 구분한다(메인 대화는 `null`). `--forward-subagent-text` 또는 `CLAUDE_CODE_FORWARD_SUBAGENT_TEXT=1`을 켜면 text/thinking 블록까지 포워딩돼 서브에이전트별 트랜스크립트를 복원할 수 있다. 모든 중첩 깊이를 포워딩하려면 v2.1.219 이상이 필요하다 — [headless](https://code.claude.com/docs/en/headless)
- `--resume`은 세션 ID, 이름, `.jsonl` 절대경로를 받는다. 세션 ID로 찾을 때는 다른 프로젝트 디렉터리까지 검색하므로 아무 디렉터리에서나 resume할 수 있다. 예시: `claude -p --resume <session-id> --output-format json "summarize what we changed"` — [headless](https://code.claude.com/docs/en/headless), [Manage sessions](https://code.claude.com/docs/en/sessions)
- `--bare`는 hooks, skills, MCP, CLAUDE.md, auto memory를 건너뛰고 OAuth와 키체인을 읽지 않으므로 `ANTHROPIC_API_KEY`나 apiKeyHelper가 있어야 한다. 문서는 "`--bare` is the recommended mode for scripted and SDK calls, and will become the default for `-p` in a future release."라고 적었다. bare 세션은 inbox socket을 바인딩하지 않아 교차 세션 메시지를 받지 못한다 — [headless](https://code.claude.com/docs/en/headless), [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- `-p`는 `--bg`와 함께 쓸 수 없다. v2.1.302부터 권한 모드를 지정하지 않은 `claude -p`는 Manual 모드로 시작하므로, 승인이 필요한 호출은 `PermissionRequest` hook이나 `--permission-prompt-tool`이 없으면 거부된다. `--permission-prompts none`(v2.1.259 이상)은 프롬프트가 떴을 호출을 모두 자동 거부한다 — [headless](https://code.claude.com/docs/en/headless)
- SIGTERM을 받으면 exit 143으로 끝나고 진행 중이던 턴은 결과 없이 미완료로 남는다. 턴을 정상 종료하려면 SIGINT를 보내거나 SDK의 `interrupt()`를 호출한다. `CLAUDE_CODE_RESUME_INTERRUPTED_TURN=1`이면 resume할 때 중단된 턴을 이어서 진행한다 — [headless](https://code.claude.com/docs/en/headless)
- 저장 위치는 `~/.claude/projects/<project>/<session-id>.jsonl`이다(경로의 영숫자 외 문자는 `-`로 바뀌고, 200자를 넘으면 잘라서 해시를 붙인다). 문서 원문: "The entry format is internal to Claude Code and changes between versions, so scripts that parse these files directly can break on any release." 관련 설정은 `CLAUDE_CONFIG_DIR`, `CLAUDE_CODE_PROJECT_DIR_NAME`(v2.1.234 이상, `CLAUDE_CONFIG_DIR`과 함께 써야 함), 보존 기간 `cleanupPeriodDays`(기본 30일)다 — [sessions](https://code.claude.com/docs/en/sessions)
- `claude -p`나 Agent SDK로 만든 세션은 세션 picker와 `claude --continue` 목록에 나오지 않는다. 그래도 `claude --resume <session-id>`로는 열린다(`claude -p --continue`는 이들을 포함한다) — [sessions](https://code.claude.com/docs/en/sessions)
- 동시성 위험(documented): "If you resume the same session in two terminals without forking, messages from both interleave into one transcript." — [sessions](https://code.claude.com/docs/en/sessions). 백그라운드 세션에는 보호 장치가 있다. agent view는 다른 live 프로세스가 열어 둔 대화를 여는 요청을 거부한다(`This conversation is already open in another running Claude session`, v2.1.248). — [agent view](https://code.claude.com/docs/en/agent-view)
- 실행 중인 백그라운드 세션에 `claude --resume <session>`을 걸면 트랜스크립트를 다시 로드하지 않고 `claude attach`로 그 프로세스에 붙는다(v2.1.285 이상). 커맨드라인에 프롬프트를 주면 그 세션의 다음 턴으로 먼저 전달된다. 단, 입출력이 pipe/redirect이거나 `--permission-mode`, `--output-format json`, `--max-turns` 같은 플래그가 있으면 아무것도 보내지 않고 exit 1로 끝나며 attach 명령만 출력한다. `--fork-session`을 주면 사본을 연다 — [sessions](https://code.claude.com/docs/en/sessions)
- resume은 `--mcp-config`, `--settings`, `--plugin-dir`, `--fallback-model`, `--add-dir`를 복원하지 않으므로 다시 넘겨야 한다. 터미널에서 resume하면 `bypassPermissions` 모드는 복원되지 않는다 — [sessions](https://code.claude.com/docs/en/sessions)
- `/branch`와 `--fork-session`은 새 session ID를 만든다. `--fork-session`으로 별도 프로세스가 되면 "Allow for this session" 승인은 이어지지 않는다 — [sessions](https://code.claude.com/docs/en/sessions)
- [LOCAL, undocumented] 트랜스크립트 레코드 `type`으로 `user`, `assistant`, `system`, `attachment`, `queue-operation`, `file-history-snapshot`, `custom-title`, `agent-name`, `last-prompt`, `permission-mode`, `api-request*`를 관찰했다. 메시지 엔트리 공통 키는 `uuid`, `parentUuid`, `sessionId`, `isSidechain`, `cwd`, `gitBranch`, `version`, `entrypoint`다.
- [LOCAL, undocumented] `~/.claude/sessions/<pid>.json`은 live 프로세스 레지스트리로 보인다. 키는 `pid`, `sessionId`, `cwd`, `kind`(`interactive`), `entrypoint`(예: `claude-desktop`), `status`(예: `idle`), `name`, `peerProtocol`, `peerFeatures`, `messagingSocketPath`(Windows 값 예: `\\.\pipe\LOCAL\cc-msg-<hash>`)이고, 옆에 비밀 키 파일 `<pid>.<hash>.key`가 있다. 같은 정보를 문서화된 방식으로 얻는 인터페이스는 `claude agents --json`(2절)이다.
- 데스크톱 앱은 세션 목록을 따로 관리하지만 CLI 세션을 resume할 수 있다 — [sessions](https://code.claude.com/docs/en/sessions)

### Inferences
- 백그라운드가 아닌 `-p`/SDK 세션에는 문서화된 잠금이 없다. 하네스는 session ID별 lease(잠금 파일)를 두고 "드라이버 하나, TUI 하나"가 동시에 쓰지 못하게 막아야 한다.
- `-p`/SDK로 굴리던 세션을 컨텍스트째 팝아웃하려면 hand-off 방식을 쓴다. ① SIGINT나 `interrupt()`로 턴을 정리하고 ② `wt -w 0 nt claude --resume <id> --settings <같은 설정> --mcp-config <같은 설정>`으로 TUI를 연다. ③ TUI가 끝나면 하네스가 같은 ID로 다시 resume한다. 사용자와 직접 나눈 대화도 같은 트랜스크립트에 남으니 별도의 재병합이 필요 없다. 다만 동시 실행은 안 되는 순차 hand-off다.
- JSONL은 화면 표시용으로만 관대하게 파싱하고, 로직은 stream-json 이벤트, hooks, SDK 함수(`getSessionMessages`)에 기대야 업그레이드 내성이 생긴다.

### Gaps
- SDK가 CLI stdin으로 interrupt나 권한 응답을 보내는 제어 프로토콜(control 메시지)은 가져온 문서에 없다. TS/Python SDK를 거치지 않고 다른 언어에서 원시 CLI를 직접 제어하면 내부 프로토콜에 의존하게 된다.
- `--input-format stream-json`의 stdin 한 줄 형식은 SDK의 `SDKUserMessage` 형태(`{"type":"user","message":{"role":"user","content":"…"},"parent_tool_use_id":null}`)로만 문서화돼 있다. CLI도 같은 형식이라는 점은 추론이고 검증하지 않았다.
- 서브에이전트 트랜스크립트 경로(`…/subagents/agent-<id>.jsonl`)를 `--resume`에 넘겼을 때 독립 세션으로 열리는지는 문서에 없고 테스트하지 않았다. 엔트리에 부모의 `sessionId`와 `isSidechain:true`가 들어 있어 그대로 열리지 않을 가능성이 높다(추론).

## 2. Claude Code 백그라운드 세션(agent view), `claude attach`, 교차 세션 메시징, channels, hooks: 관찰·조종·알림 표면

### Takeaway
Claude Code 2.1.x에는 "supervisor 데몬이 최상위 세션 여러 개를 띄우고 사용자가 attach하는" 모델이 이미 들어 있다. `claude --bg`로 띄우고, `claude agents --json`으로 상태를 보고, `claude attach <id>`로 어느 터미널에서든 그 프로세스에 전체 컨텍스트째 붙는다. detach해도 세션은 계속 돈다. 요구사항 "한 명령 팝아웃"에 가장 가까운 문서화된 기능이다. 실행 중에 지시를 넣는 방법은 세 가지다. attach해서 입력하기(작업 중이면 큐에 쌓임), 교차 세션 `SendMessage`(Windows에서는 named pipe), channels(research preview). 각 세션에 `http` hook을 걸면 대시보드로 이벤트를 보낼 수 있다. 다만 전부 research preview이고, 비대화형으로 "실행 중인 bg 세션에 텍스트를 보내는" CLI는 문서화돼 있지 않다.

### Cited Findings
- 명령(documented): `claude --bg "<prompt>"`, `claude --agent code-reviewer --bg "…"`, `claude --bg --name "flaky-test-fix" "…"`, `claude --resume <uuid> --bg "pick up where you left off"`, `claude --bg --exec 'pytest -x'`, `claude agents [--cwd <path>] [--json] [--all]`, `claude attach <id|name>`, `claude logs <id|name>`, `claude stop|kill <id>`, `claude respawn <id>|--all`, `claude rm <id>`, `claude daemon status|logs|stop --any [--keep-workers]`. `--bg`는 `-p`와 함께 쓰면 거부된다 — [agent view](https://code.claude.com/docs/en/agent-view)
- `claude attach` 도움말: "Open the background session in this terminal. ← returns to agent view, Ctrl+Z drops back to your shell. The session keeps running either way." `claude agents --json`: "Print active sessions (interactive and background) as a JSON array and exit (for scripting; does not require a TTY)" — [LOCAL: `claude attach --help`, `claude agents --help` v2.1.309]
- `claude agents --json`의 필드는 `cwd`, `kind`(`interactive`/`background`), `startedAt`, `id`(short id), `state`(`working|blocked|done|failed|stopped`), `pid`, `status`(`busy|waiting|idle`), `waitingFor`(`permission prompt|input needed|sandbox request|worker request|dialog open`), `sessionId`(`--resume`에 쓸 수 있는 UUID), `name`이다. 스크립트에서는 `claude agents --json --all`을 폴링하라고 하고, "Don't parse `~/.claude/jobs/<id>/state.json` directly"라고 못박았다 — [agent view](https://code.claude.com/docs/en/agent-view)
- 구조: supervisor는 처음 백그라운드 세션을 띄우거나 agent view를 열 때 자동으로 시작한다. 각 세션은 별도의 Claude Code 프로세스다. 저장 위치는 `~/.claude/daemon.log`, `~/.claude/daemon/roster.json`, `~/.claude/jobs/<id>/state.json`이고, 각 세션은 `CLAUDE_JOB_DIR=~/.claude/jobs/<id>` 환경 변수를 받는다. 끝났거나 입력을 기다리는 세션이 약 1시간 동안 attach되지 않으면 프로세스가 정지되고, 다음 attach나 답장 때 트랜스크립트에서 재시작한다(`Ctrl+T`로 고정하면 정지되지 않음). 머신이 재부팅되면 세션은 failed/stopped로 표시되고 attach하면 저장된 대화에서 이어진다 — [agent view](https://code.claude.com/docs/en/agent-view)
- attach하면 터미널이 실행 중인 프로세스에 붙어 완전한 대화형 세션이 되고, 자리를 비운 동안의 요약(recap)이 나온다. detach(`←`, `/exit`, `Ctrl+Z`)는 세션을 멈추지 않는다. 이름으로 attach하는 기능은 프로세스가 살아 있을 때만 동작한다(v2.1.290 이상). 멈춘 세션은 ID로 attach해야 한다 — [agent view](https://code.claude.com/docs/en/agent-view)
- 메시지 전송 방식: agent view의 peek 패널에서 답장하거나, `claude attach` 후 입력한다. 세션이 작업 중이면 답장은 큐에 쌓이고 인터럽트하지 않는다(`/model`, `/effort`, `/rename`, `/usage`는 즉시 실행). 권한 프롬프트는 일반 답장으로 응답되지 않는다. 문서에서 비대화형 "메시지 전송" 셸 명령은 찾지 못했다 — [agent view](https://code.claude.com/docs/en/agent-view)
- 알림: agent view가 열려 있는 동안 로컬 백그라운드 세션이 입력을 필요로 하거나 끝나거나 실패하면 `preferredNotifChannel`로 알림이 가고 `Notification` hook이 `agent_needs_input`/`agent_completed` 타입으로 실행된다 — [agent view](https://code.claude.com/docs/en/agent-view)
- 격리와 부작용: 백그라운드로 띄운 세션은 `.claude/worktrees/` 아래 자기 git worktree에서 편집한다(`worktree.bgIsolation: "none"`으로 끌 수 있음). v2.1.198부터는 worktree로 격리된 bg 세션이 끝나면 묻지 않고 자기 브랜치를 commit·push하고 draft PR을 연다. v2.1.281부터 `claude --bg`는 workspace trust를 먼저 확인하며, 스크립트처럼 대화창을 띄울 수 없는 곳에서는 `Workspace not trusted` 오류로 종료한다 — [agent view](https://code.claude.com/docs/en/agent-view)
- Windows 지원 근거: 트러블슈팅 표에 `supervisor (pid=<pid>) is still running | Windows | taskkill /PID <pid>` 항목이 있고, Windows의 stale `daemon.lock` 수정(v2.1.257), win32-input-mode 키 입력 수정(v2.1.248), attach 직후 `←` 처리(v2.1.218) 같은 Windows 전용 수정이 이어졌다. 상태는 "Research preview"이고 끄려면 `disableAgentView` 또는 `CLAUDE_CODE_DISABLE_AGENT_VIEW=1`을 쓴다. 한계는 다음과 같다. "running ten agents in parallel uses quota roughly ten times as fast", 세션은 로컬에서만 돌고, 세션을 삭제하면 Claude가 만든 worktree도 지워진다 — [agent view](https://code.claude.com/docs/en/agent-view)
- [LOCAL, undocumented] `~/.claude/daemon/pipe.key` 파일이 있다(이 PC에서 supervisor를 이전에 쓴 흔적으로 보임). `~/.claude/jobs`는 지금 없다.
- `/fork`(v2.1.212 이상)는 현재 대화를 새 백그라운드 세션으로 복사하고 원본은 계속 돈다. 이전 동작이던 in-session fork는 `/subtask`로 옮겨졌다 — [agent view](https://code.claude.com/docs/en/agent-view)
- 교차 세션 메시징(documented): Claude가 `ListAgents`로 대상을 찾고 `SendMessage`로 보낸다. 사용자는 `@세션이름` 멘션이나 `/list-agents`(`/peers`)를 쓸 수 있다. 같은 머신이면 "per-session socket on macOS and Linux, or a per-session named pipe on native Windows, never through Anthropic servers"로 전달된다. native Windows는 v2.1.234 이상이 필요하다. 다른 머신이나 클라우드 세션은 Remote Control(claude.ai 로그인 필요)을 거친다. WSL 2 세션과 native Windows 세션은 서로 메시지를 주고받지 못한다 — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- 전달 시점: 수신 세션이 턴을 실행 중이면 도구 호출 사이에 읽고(실행 중인 도구는 끊지 않음), idle이면 새 턴을 시작한다. `SendMessage`의 `notify_when_idle`(v2.1.236 이상)은 대상이 idle이 되거나 끝날 때 알림을 한 번 받는다(메인 대화만, 같은 머신의 세션에만 가능). 메시지는 평문만 되고, 크기는 약 100만 자까지, 수락된 메시지는 최대 50개까지 큐에 쌓이고, 보류 메시지는 최대 100개다. 짧은 시간에 몰아서 보내면 송신 측에서 거부된다 — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- 신뢰 규칙: 다른 세션이 보낸 메시지는 사용자 동의로 간주되지 않아 권한 프롬프트를 승인하지 못하고 설정도 바꾸지 못한다. 메시지 속 `/명령`은 실행되지 않는다. 수신 정책은 `crossSessionInbound: accept|hold|refuse`로 정한다. 값이 없으면 두 세션의 권한 모드 클래스로 판단하고, bypass 모드인 수신 세션은 메시지를 보류한다. `claude -p` 세션도 inbox socket을 바인딩하므로(bare는 제외) 무인 워커라면 `--settings`에 `crossSessionInbound: "accept"`를 넣으라고 안내한다 — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- 스크립트에서 세션 inbox로 보내는 방법: hooks와 Bash 명령은 `CLAUDE_CODE_MESSAGING_SOCKET`, `CLAUDE_CODE_MESSAGING_TOKEN`을 받는다(SessionStart 전에 export됨). native Windows에서는 연결의 첫 줄이 `{"type":"auth","token":"<token>"}`이어야 하고, 아니면 연결이 닫힌다. 30초 안에 완전한 한 줄을 보내지 않아도 닫힌다. 문서에는 인증 줄만 있고 메시지 본문 줄 형식은 없다 — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging), [env vars](https://code.claude.com/docs/en/env-vars)
- Channels(research preview): MCP 서버가 실행 중인 세션에 이벤트를 밀어 넣는 기능이고 양방향 reply 도구를 쓸 수 있다. `claude --channels plugin:<name>@<marketplace>`로 켜고, 직접 만든 서버는 `--dangerously-load-development-channels server:<name>`로 테스트한다. Anthropic 허용 목록에 있는 플러그인만 등록된다(조직은 `allowedChannelPlugins`로 지정). claude.ai 로그인이나 Console API key가 필요하고 Bedrock/Vertex/Foundry에서는 쓸 수 없다. Team/Enterprise는 `channelsEnabled`를 켜야 한다. 이벤트는 모델에 `<channel source="…">`로 전달되며 "Events only arrive while the session is open"이다. `-p`에서는 터미널 입력이 필요한 도구가 비활성화된다. v2 MCP client runtime은 protocol revision 2026-07-28을 협상하는 channel 서버를 등록하지 않는다 — [channels](https://code.claude.com/docs/en/channels)
- Hooks(documented): 이벤트는 `SessionStart`, `Setup`, `UserPromptSubmit`, `UserPromptExpansion`, `PreToolUse`, `PermissionRequest`, `PermissionDenied`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `Notification`, `MessageDisplay`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `Stop`, `StopFailure`, `TeammateIdle`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `DirectoryAdded`, `FileChanged`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `PostCompact`, `PreModelSwitch`, `PostModelSwitch`, `Elicitation`, `ElicitationResult`, `SessionEnd`이다. Notification 타입은 `permission_prompt`, `idle_prompt`, `agent_needs_input`, `agent_completed` 등이다. hook 종류는 `command`, `http`(JSON을 URL로 POST), `mcp_tool`, `prompt`, `agent`가 있다. 공통 입력은 `session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`이고, 서브에이전트나 팀원 안에서는 `agent_id`, `agent_type`이 추가된다. `hookSpecificOutput.additionalContext`로 컨텍스트를 주입할 수 있고(SessionStart, UserPromptSubmit, Stop, SubagentStop 등), exit 2로 차단할 수 있다. `"async": true`나 `"asyncRewake": true` 옵션도 있다 — [hooks](https://code.claude.com/docs/en/hooks)
- `--remote-control [name]`은 Remote Control을 켠 대화형 세션을 시작한다. Remote Control 세션끼리는 기기를 넘어 교차 세션 메시지를 주고받을 수 있다(claude.ai 로그인 필요) — [LOCAL: `claude --help`], [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)

### Inferences
- 하네스 관점에서 정리하면 다음과 같다. spawn은 `claude --bg`, 관찰은 `claude agents --json --all` 폴링과 세션별 `http` hook(Stop, Notification, SubagentStop, TaskCompleted, SessionStart), 팝아웃은 `wt -w 0 nt --title <role> claude attach <id>`, 지시 주입은 SendMessage/MCP 버스/channel이다. 이 조합으로 (a)~(f)를 대부분 문서화된 수단만으로 채울 수 있다.
- SessionStart hook에서 `CLAUDE_JOB_DIR`(bg short id를 알 수 있음), `session_id`, `transcript_path`를 하네스에 등록하게 하면 역할 이름과 세션 ID, bg id를 안정적으로 매핑할 수 있다.
- 리서치 전용 역할을 git 저장소 안에서 bg로 띄우면 worktree를 만들고 PR까지 자동으로 여는 부작용이 생긴다. 역할 정의나 설정에서 `worktree.bgIsolation`을 의식적으로 정해야 한다.
- 하네스가 세션의 named pipe로 직접 쓰려면 각 세션의 토큰(hook 환경에만 있음)을 수집해야 한다. 메시지 형식도 문서에 없어 취약하다. 문서화된 길은 "Claude 세션끼리 SendMessage를 쓰고, 하네스는 MCP 도구나 channel로 주입"하는 것이다.

### Gaps
- 동시에 띄울 수 있는 백그라운드 세션 수의 상한은 문서에 숫자로 나와 있지 않다(쿼터만 언급됨).
- `claude --bg`와 `--settings`, `--mcp-config`, `--agents`를 함께 쓸 수 있는지는 예시가 일부만 있어 확인하지 못했다(`claude agents`는 `--settings`, `--mcp-config`를 공식 지원).
- `Notification` hook의 `agent_needs_input`/`agent_completed`가 agent view를 열지 않았을 때도 실행되는지 불명확하다(문서는 "While agent view is open"이라고만 함).
- socket이나 named pipe 메시지 본문 형식은 문서에 없다.

## 3. Claude Agent SDK(TS/Python) 세션 API, 프로그래매틱 서브에이전트, 서브에이전트를 독립 대화형 세션으로 꺼낼 수 있는가

### Takeaway
SDK는 CLI 바이너리를 subprocess로 띄우는 공식 래퍼다. `resume`, `forkSession`, `sessionId`, `continue`, `persistSession`, streaming input(`streamInput`, 메시지 큐잉), `interrupt()`, `canUseTool`, 프로그래매틱 `agents`를 제공한다. SDK로 만든 세션은 CLI `claude --resume <id>`로 열 수 있다. 그래서 "SDK가 굴리다가 TUI로 hand-off"는 문서화된 경로다. 반면 세션 안의 서브에이전트를 독립 대화형 세션으로 바꾸는 방법은 문서에 없다. 서브에이전트는 부모 세션 안에서 `SendMessage`로만 재개된다.

### Cited Findings
- Options(documented): `resume`, `resumeSessionAt`(메시지 UUID 시점), `forkSession`, `continue`, `sessionId`(UUID 지정), `persistSession`(false면 디스크 미기록), `sessionStore`(alpha, 외부 저장소 미러링), `agents: Record<string, AgentDefinition>`, `agent`, `agentProgressSummaries`, `canUseTool`, `permissionMode`, `permissionPrompts: 'host'|'none'`, `includePartialMessages`, `forwardSubagentText`, `includeHookEvents`, `settingSources`, `pathToClaudeCodeExecutable`, `spawnClaudeCodeProcess`, `env` — [TypeScript SDK reference](https://code.claude.com/docs/en/agent-sdk/typescript)
- Query 메서드: `interrupt()`(streaming input 모드 전용), `setPermissionMode()`, `setModel()`, `streamInput(stream)`, `stopTask(taskId)`, `close()`, `applyFlagSettings()`, `supportedAgents()`, `mcpServerStatus()`, `getContextUsage()`, `rewindFiles()` 등. 세션 함수는 `listSessions()`, `getSessionMessages()`, `getSessionInfo()`, `renameSession()`, `tagSession()`이다(Python은 snake_case) — [TypeScript SDK reference](https://code.claude.com/docs/en/agent-sdk/typescript), [SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions)
- SDK는 "runs the Claude Code CLI as a subprocess"이고 플랫폼별 네이티브 바이너리를 optional dependency로 번들한다. `CLAUDE_AGENT_SDK_CLIENT_APP`으로 User-Agent에 앱을 식별할 수 있다 — [TypeScript SDK reference](https://code.claude.com/docs/en/agent-sdk/typescript)
- 실험적 V2 세션 API(`createSession()`)는 TS SDK 0.3.142에서 제거됐다. Python은 `ClaudeSDKClient`가 세션을 자동으로 이어 간다. 저장 위치는 CLI와 같은 `~/.claude/projects/<encoded-cwd>/*.jsonl`이다. 다른 호스트에서 resume하려면 `SessionStore` 어댑터를 쓰거나 파일을 옮겨야 한다 — [SDK sessions](https://code.claude.com/docs/en/agent-sdk/sessions)
- Streaming input 모드는 권장 방식이며 "Queued messages: send multiple messages that process sequentially, with ability to interrupt"를 지원한다. single message 모드는 이미지 첨부, 동적 큐잉, 실시간 인터럽트를 지원하지 않는다. `SDKUserMessage`는 `{type:"user", message:{role:"user", content}, parent_tool_use_id:null}` 형태다 — [Streaming input](https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode)
- 서브에이전트(documented): `agents` 옵션의 `AgentDefinition` 필드는 `description`, `prompt`(필수), `tools`, `disallowedTools`, `model`, `skills`, `memory`, `mcpServers`, `initialPrompt`, `maxTurns`, `autoCompactWindow`, `background`, `omitClaudeMd`, `effort`, `permissionMode`다. 기본으로 백그라운드에서 실행되고 Agent 도구 결과는 `status: "async_launched"`다. TS에서는 서브에이전트 메시지마다 `agent_id`(task 이벤트의 `task_id`와 같음, TS SDK 0.3.292 이상)가 붙는다. fork는 `subagent_type: "fork"`(v2.1.302 이상)이고 `Agent(fork)` deny 규칙으로 막을 수 있다 — [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- 서브에이전트 재개(documented): Agent 도구 결과 텍스트의 `agentId: <id>`를 파싱한 뒤 같은 세션을 `resume`하고 "Resume agent <id> …"라고 프롬프트를 보낸다. `Explore`, `Plan`은 일회성이라 재개할 수 없다. 제한 설정은 `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`(기본 3), `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`(기본 20), `maxBudgetUsd`다. 수십~수백 개 에이전트를 돌릴 때는 `Workflow` 도구(TS SDK 0.3.149 이상)를 쓴다 — [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- CLI 서브에이전트 트랜스크립트는 `~/.claude/projects/{project}/{sessionId}/subagents/agent-{agentId}.jsonl`에 메인 대화와 별도로 저장된다. Claude는 `SendMessage`(to: agentId 또는 이름)로 서브에이전트를 재개하고, 사용자는 서브에이전트 패널에서 그 트랜스크립트에 직접 입력해 재개할 수 있다. 문서에 "서브에이전트를 별도 대화형 세션으로 연다"는 기능은 없고, 별도 세션이 필요하면 background agents와 cross-session messaging을 안내한다 — [sub-agents](https://code.claude.com/docs/en/sub-agents)
- [LOCAL, undocumented] 서브에이전트 폴더에는 `agent-<id>.jsonl`과 `agent-<id>.meta.json`(키: `agentType`, `description`, `toolUseId`, `spawnDepth`, `launchedWithDefaults`, `requestShape`, `requestNonInteractive`)이 있다. 엔트리는 `isSidechain: true`, `agentId`, 그리고 부모의 `sessionId`를 가진다.
- 버전: `@anthropic-ai/claude-agent-sdk` 0.3.310(2026-10-23, license 필드 "SEE LICENSE IN README.md"), PyPI `claude-agent-sdk` 0.2.174(MIT) — [npm](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk), [PyPI](https://pypi.org/project/claude-agent-sdk/) (2026-10-25 `npm view`·PyPI JSON으로 조회)

### Inferences
- 실행 도중 메시지를 넣는 요구 (d)는 SDK streaming input(`streamInput`, 턴 사이 큐잉)과 `interrupt()`로 문서화된 방식으로 해결된다. 대시보드 표시 (b)는 typed message와 `parent_tool_use_id`/`agent_id`로 해결된다.
- 팝아웃 (c)는 SDK 세션도 "턴 경계에서 `close()`/`interrupt()` 후 `claude --resume <sessionId>`를 TUI로 열고, 끝나면 SDK `resume`으로 회수"하는 hand-off로만 가능하다. 실시간으로 함께 붙는 방식은 SDK 소유 세션에 없다. 팀 쪽 작업을 멈추지 않으려면 `forkSession`으로 사본을 팝아웃하고, 돌아온 뒤 사본의 새 턴을 요약해 팀 세션에 주입한다.
- 역할 에이전트를 세션 안의 서브에이전트로 만들면 나중에 팝아웃할 수 없다. 팝아웃할 가능성이 있는 역할은 처음부터 최상위 세션(bg 세션 또는 SDK 세션)으로 띄워야 한다.

### Gaps
- `claude --resume`으로 서브에이전트 JSONL을 여는 방법, 그리고 서브에이전트 엔트리를 새 sessionId로 다시 써서 독립 세션으로 만드는 "변환" 방법은 문서에 없고 검증하지 않았다(내부 포맷 의존).
- SDK 세션을 TUI로 연 상태에서 SDK가 같은 ID를 resume하면 어떻게 막히는지(잠금 여부)는 문서에 없다.

## 4. Agent teams 내부 구조: 팀 설정, 태스크, 메일박스, 프로세스 모델, 메시징

### Takeaway
Agent teams는 실험 기능이다(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). 리드 세션과 팀원, 공유 태스크 목록(파일 락), JSON 메일박스로 구성된다. 사용자가 팀원을 골라 직접 대화할 수는 있다. 그러나 대화형 세션에서만 팀원을 띄울 수 있고(`-p`와 SDK 불가), 분할 창은 tmux나 iTerm2에서만 되며 Windows Terminal은 지원하지 않는다. resume하면 in-process 팀원이 복원되지 않는다. 그래서 Windows에서 "별도 창으로 팝아웃"하는 기반으로는 부적합하다.

### Cited Findings
- 저장 위치(documented): 메일박스는 `~/.claude/teams/{team-name}/inboxes/{agent-name}.json`, 팀 설정은 `~/.claude/teams/{team-name}/config.json`(세션이 끝나면 삭제되고 session ID, tmux pane ID 같은 런타임 상태를 담으므로 손으로 고치지 말 것), 태스크는 `~/.claude/tasks/{team-name}/`(세션 후에도 남음)이다. 팀 이름은 `session-` 뒤에 session ID 앞 8자를 붙인 것이다. 설정의 `members` 배열에는 이름, agent ID, 에이전트 타입이 있고 리드의 타입은 `team-lead`다. 태스크 claim은 파일 락으로 경쟁 상태를 막는다 — [agent teams](https://code.claude.com/docs/en/agent-teams)
- 프로세스와 표시 모드: 팀원은 "Separate Claude Code instances"이고 표시 모드는 in-process(기본, 어느 터미널에서나 동작)와 split panes(tmux 또는 iTerm2의 `it2`)가 있다. 설정은 `teammateMode` 또는 숨은 플래그 `--teammate-mode`로 한다. "Split-pane mode isn't supported in VS Code's integrated terminal, Windows Terminal, or Ghostty." in-process 팀원의 백그라운드 작업은 "can't outlive the lead's process"라서, 리드 프로세스 안에서 돈다는 뜻으로 읽힌다 — [agent teams](https://code.claude.com/docs/en/agent-teams)
- 메시징: 팀원은 `SendMessage`로 이름을 지정해 1:1로 보낸다(브로드캐스트하려면 수신자마다 따로 보냄). 메시지는 자동 전달되고, 팀원이 멈추면 최종 답이 담긴 idle 알림이 리드에게 간다. in-process 모드에서는 화살표와 Enter로 팀원 트랜스크립트를 열고 입력해 직접 메시지를 보내며, `x`로 정지하고 `Ctrl+T`로 태스크 목록을 연다 — [agent teams](https://code.claude.com/docs/en/agent-teams)
- 제약: 대화형 세션에서만 팀원을 띄울 수 있다("In non-interactive mode with the `-p` flag, including Agent SDK sessions, Claude doesn't spawn teammates"). 이름이 있는 서브에이전트는 자동으로 팀원으로 띄워진다. hooks는 `TeammateIdle`, `TaskCreated`, `TaskCompleted`(exit 2로 피드백)다. 한계는 다음과 같다. `/resume`과 `/rewind`가 in-process 팀원을 복원하지 않는다, 세션당 팀은 하나, 중첩 팀 불가, 리드 고정, 태스크 상태 지연, 종료가 느림, 팀원의 권한 프롬프트는 리드 쪽에 뜸. 3~5명으로 시작하라고 권한다(하드 리밋 없음) — [agent teams](https://code.claude.com/docs/en/agent-teams)
- 팀원 간 메시지는 "from another Claude session, not from you"로 표시되어 권한 승인을 대신하지 못한다. auto mode에서는 classifier가 각 메시지를 검토한다 — [agent teams](https://code.claude.com/docs/en/agent-teams)
- [LOCAL] 이 PC에는 `~/.claude/teams`, `~/.claude/tasks`가 없다(agent teams를 쓰지 않음).

### Inferences
- 사용자의 지금 구성(한 채팅에서 PM, 리서치, 종합 역할을 프롬프트로 정의)은 agent teams로 옮기면 "같은 창에서 팀원을 골라 직접 대화"까지는 즉시 된다. 별도 창이나 탭으로 팝아웃은 Windows Terminal에서 불가능하다. 따라서 하네스 기반으로는 2절의 bg 세션 모델이 더 맞다.
- 팀 파일(메일박스와 태스크 JSON)은 경로가 문서화돼 있지만 형식은 런타임 상태이고 수정이 금지돼 있다. 대시보드에서 읽기 전용으로 관찰하는 것까지만 현실적이다.

### Gaps
- 메일박스와 태스크 JSON의 스키마는 문서에 없다. 로컬에서 팀을 써 본 적이 없어 관찰하지도 못했다.

## 5. Codex 제어 표면: `codex exec --json`, resume/fork, app-server(JSON-RPC), `--remote` TUI, 서브에이전트 스레드

### Takeaway
Codex의 핵심 제어 표면은 app-server다. VS Code 확장과 Codex 앱이 쓰는 JSON-RPC이며 thread, turn, item 단위로 동작하고 `turn/steer`, `turn/interrupt`, `thread/inject_items`, `thread/fork`를 제공한다. 공식 문서가 있지만 명령과 WebSocket transport는 "experimental"이고 "aren't supported for production workloads"라고 명시돼 있다. `codex --remote ws://…`로 TUI를 같은 app-server에 붙일 수 있어 Claude의 attach에 해당하는 구조가 가능하다. 다만 Windows에서는 app-server 데몬이 지원되지 않는다(로컬 검증). 단순 경로는 `codex exec --json`과 `codex exec resume`이다.

### Cited Findings
- 로컬 v0.144.5 명령(documented, 도움말): `exec`, `resume`, `fork`, `archive`, `delete`, `unarchive`, `mcp-server`("Start Codex as an MCP server (stdio)"), `app-server [experimental]`, `remote-control [experimental]`, `exec-server [EXPERIMENTAL]`, `features`. TUI 옵션 `--remote <ADDR>`("Connect the TUI to a remote app server endpoint. Accepted forms: `ws://host:port`, `wss://host:port`, `unix://`, or `unix://PATH`"), `--remote-auth-token-env`. `codex resume [SESSION_ID] [PROMPT]`은 `--last`, `--all`, `--include-non-interactive`(exec 세션도 picker와 --last에 포함), `--remote`를 받는다. `codex exec resume [SESSION_ID|thread name] [PROMPT]`, `--json`, `--ephemeral`, `-o/--output-last-message`, `--output-schema`도 있다 — [LOCAL: `codex --help`, `codex exec --help`, `codex resume --help` v0.144.5]
- exec 문서: `--json`은 stdout을 JSONL로 바꾸고 이벤트는 `thread.started`, `turn.started`, `turn.completed`, `turn.failed`, `item.*`, `error`다. item 종류는 agent message, reasoning, command execution, file change, MCP tool call, web search, plan update다. 기본 sandbox는 read-only다. `codex exec resume --last "<task>"`나 `codex exec resume <SESSION_ID>`로 이어 간다. `CODEX_API_KEY`는 exec, review, TypeScript SDK에서 쓸 수 있다. 문서에 `--approve-for-me`가 언급되지만 로컬 0.144.5 도움말에는 없어 버전 차이로 보인다 — [Codex non-interactive mode](https://learn.chatgpt.com/docs/non-interactive-mode)
- app-server 문서: "the interface Codex uses to power rich clients (for example, the Codex VS Code extension)". 자동화나 CI에는 Codex SDK를 권한다. 안정성 항목에서는 "The `app-server` command and WebSocket transport are experimental … aren't supported for production workloads"라고 하고, `experimentalApi` 게이트 뒤의 메서드는 바뀔 수 있다고 한다. 메시지는 JSON-RPC 2.0이지만 `"jsonrpc"` 필드를 생략한다. transport는 `stdio://`(기본, JSONL), `ws://IP:PORT`, `unix://`. lifecycle은 `initialize`, `initialized`, `thread/start|resume|fork`, `turn/start`, (`turn/steer` with `expectedTurnId`, `turn/interrupt`), `turn/completed` 순이다. 서드파티 통합에 대해서는 `clientInfo.name`이 OpenAI Compliance Logs Platform에 쓰이니 설정하라, 엔터프라이즈는 OpenAI에 연락해 known clients 목록에 등록하라, `plugin/*`은 프로덕션에 쓰지 말라고 적었다 — [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- 승인 흐름: 서버가 `item/commandExecution/requestApproval`(결정값 `accept|acceptForSession|decline|cancel|acceptWithExecpolicyAmendment`)와 `item/fileChange/requestApproval`을 클라이언트에 요청하고, 처리되면 `serverRequest/resolved`, `item/completed` 순으로 이어진다. 로그인(`account/login/start`) 방식은 `apiKey`, `chatgpt`(브라우저), `chatgptDeviceCode`, `chatgptAuthTokens`(experimental, 호스트가 토큰을 주입)다. collab item `collabToolCall`의 필드는 `senderThreadId`, `receiverThreadId`, `newThreadId`, `prompt`, `agentStatus`다 — [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- 여러 클라이언트: `thread/start`를 호출하면 그 스레드 이벤트를 구독한다. `thread/unsubscribe`의 "If this was the last subscriber" 문구로 미루어 한 스레드를 여러 연결이 구독할 수 있다. 문서가 이를 명시하지는 않는다 — [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- [LOCAL, documented via 생성기] `codex app-server generate-json-schema`(0.144.5)로 뽑은 안정(stable) 메서드는 87개다. `thread/start`, `thread/resume`, `thread/fork`, `thread/list`, `thread/loaded/list`, `thread/read`, `thread/inject_items`, `thread/unsubscribe`, `thread/rollback`, `thread/name/set`, `thread/goal/*`, `turn/start`, `turn/steer`, `turn/interrupt`, `review/start`, `command/exec`, `hooks/list` 등이 있다. 서버 요청은 `item/commandExecution/requestApproval`, `item/fileChange/requestApproval`, `item/tool/requestUserInput`, `item/permissions/requestApproval`, `item/tool/call`, `mcpServer/elicitation/request` 등이다. 알림 68개에는 `thread/started`, `thread/status/changed`, `turn/started`, `turn/completed`, `item/started`, `item/completed`, `item/agentMessage/delta`, `hook/started`, `hook/completed`가 있다. experimental 전용으로는 `thread/turns/list`, `thread/items/list`, `thread/search`, `process/spawn`, `remoteControl/*`가 있다. 문서는 생성된 스키마가 "specific to the Codex version you ran"이라고 한다.
- [LOCAL] 서브에이전트 스키마: `CollabAgentTool` = `spawnAgent|sendInput|resumeAgent|wait|closeAgent`, `CollabAgentStatus` = `pendingInit|running|interrupted|completed|errored|shutdown|notFound`. `SubAgentSource.thread_spawn` = `{parent_thread_id, depth, agent_nickname, agent_role, agent_path}`이므로 서브에이전트는 자기 thread ID를 가진 별도 스레드다. `SessionSource` = `cli|vscode|exec|appServer|custom|subAgent`. Codex hook 이벤트(`HookEventName`)는 `preToolUse, permissionRequest, postToolUse, preCompact, postCompact, sessionStart, userPromptSubmit, subagentStart, subagentStop, stop`이다. `codex features list`에서 `multi_agent`는 stable/true, `multi_agent_v2`는 under development, `hooks`는 stable이지만 기본 false다.
- [LOCAL] Windows에서 `codex app-server daemon version`을 실행하면 "Error: codex app-server daemon lifecycle is only supported on Unix platforms"가 나온다. `codex app-server proxy --sock`도 Unix 소켓 기반이다.
- 서브에이전트 문서: `agents.enabled`는 기본 true다. 커스텀 에이전트는 TOML 파일로 `~/.codex/agents/`나 `.codex/agents/`에 두며 필수 필드는 `name`, `description`, `developer_instructions`다. 내장 에이전트는 `default`, `worker`, `explorer`다. `agents.max_concurrent_threads_per_session`(구 별칭 `agents.max_threads`)으로 동시 스레드 수를 정한다. CLI에서는 "Use `/subagents` to inspect and switch between agent threads while they run"이고, 비활성 스레드의 승인 요청에는 출처 라벨이 붙어 `o`로 연다. 비대화형에서 새 승인을 띄울 수 없으면 실패하고 오류가 부모에게 돌아간다. 서브에이전트는 부모의 sandbox와 승인 설정을 상속한다 — [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [LOCAL, internal] rollout 파일은 `~/.codex/sessions/YYYY/MM/DD/rollout-<ISO시각>-<uuid>.jsonl`이고 레코드 `type`은 `session_meta`(payload: `id`, `session_id`, `cwd`, `originator`, `source`, `cli_version`, `multi_agent_version`, `history_mode`…), `event_msg`, `response_item`이다. `~/.codex/archived_sessions/`도 있다.
- 버전과 라이선스: `@openai/codex` 0.164.0, `@openai/codex-sdk` 0.164.0, 둘 다 Apache-2.0(2026-10-23) — [npm @openai/codex](https://www.npmjs.com/package/@openai/codex)

### Inferences
- Codex에서 "팝아웃하되 팀에 남기"를 가장 깔끔하게 하는 방법은 하네스가 `codex app-server --listen ws://127.0.0.1:<port>`(Windows는 데몬 대신 직접 띄운 프로세스)를 소유하고 역할마다 thread를 만드는 것이다. 팝아웃은 `wt -w 0 nt codex resume <threadId> --remote ws://127.0.0.1:<port>`로 같은 서버에 TUI를 붙인다. 하네스와 TUI가 같은 live thread를 함께 구독하는 이론상 최선의 구조다. 다만 ws transport가 experimental이고 Windows 지원도 공식적이지 않다.
- 실행 도중 지시 (d)는 `turn/steer`(expectedTurnId 필수), 결과 회수 (f)는 `thread/read`나 `turn/completed`와 synthesizer 스레드에 대한 `thread/inject_items`/`turn/start`로 문서화된 방식으로 구현할 수 있다.
- exec 경로는 턴 단위다. 실행 중 지시는 불가능하고, 팝아웃은 실행이 끝난 뒤 `codex resume <id>`(TUI)로 하는 hand-off다. 동시 writer 보호 장치가 문서에 없으니 lease가 필요하다.
- Codex 서브에이전트는 자기 thread ID를 갖고 `/subagents`로 전환할 수 있으므로, Claude 서브에이전트보다 팝아웃 후보로 낫다. 단, 독립 resume이 되는지는 미확인이다.

### Gaps
- TUI가 `--remote`로 붙은 상태에서, 다른 클라이언트가 이미 로드해 턴을 돌리는 스레드를 `codex resume <threadId>`로 열면 두 번째 구독자로 붙는지는 문서에 명시가 없다. Windows에서 ws listener와 `--remote`가 동작하는지도 검증하지 않았다(실험 필요).
- 서브에이전트 스레드(`thread_spawn`)를 `codex resume <childThreadId>`로 독립적으로 열 수 있는지는 미확인이다.
- `codex mcp-server`가 노출하는 도구 이름과 인자는 이번에 확인하지 못했다.
- 로컬 0.144.5와 최신 0.164.0 사이 프로토콜 차이는 확인하지 않았다(설치된 버전마다 스키마를 생성해 고정해야 함).

## 6. ACP(Agent Client Protocol) 2026 상태: 메서드, 어댑터, 지원 현황, 성숙도와 공백

### Takeaway
ACP v1은 세션 lifecycle(new, load, resume, close, list, delete), prompt, 권한 요청, 터미널, fs를 갖춘 실사용 표준이다. Claude Code와 Codex용 공식 어댑터, Gemini CLI의 `--acp`가 있어 여러 벤더를 한 대시보드 프로토콜로 정규화하기에 좋다. 하지만 ACP는 "클라이언트 하나가 에이전트 subprocess 하나를 stdio로 소유"하는 구조여서 TUI를 붙이는 팝아웃 개념이 없다. 서브에이전트 자식 세션 RFD는 자식에게 prompt, steer, load, resume을 모두 금지한다. v2는 2026-07-20 이후 Draft 상태다.

### Cited Findings
- 기본 메서드: 에이전트 쪽은 `initialize`, `authenticate`, `session/new`, `session/prompt`, 선택 메서드 `session/load`(`loadSession` capability), `logout`, `session/set_mode`, 알림 `session/cancel`이다. 클라이언트 쪽은 `session/request_permission`(기본), 선택 메서드 `fs/read_text_file`, `fs/write_text_file`, `terminal/create|output|release|wait_for_exit|kill`, `elicitation/create`, 알림 `session/update`다. 기반은 JSON-RPC 2.0이고, 확장은 `_meta`와 `_` 접두 메서드로 한다 — [ACP overview](https://agentclientprotocol.com/protocol/overview)
- 세션: `session/new`(`cwd`, `mcpServers`)가 있다. `session/load`는 전체 히스토리를 `session/update`로 재생한 뒤 응답한다. `session/resume`(`sessionCapabilities.resume`)은 재생하지 않는다. `session/close`(`sessionCapabilities.close`)와 `additionalDirectories`도 있으며 예시는 `protocolVersion: 1`이다 — [ACP session setup](https://agentclientprotocol.com/protocol/session-setup)
- RFD 상태(Completed만 안정성을 약속함): session-list Completed(2026-03), session-resume Completed(2026-04-22), session-close Completed(2026-04-23), session-delete Completed(2026-06). session-fork, proxy-chains, Streamable HTTP & WebSocket Transport는 Draft다 — [RFD updates](https://agentclientprotocol.com/rfds/updates), [RFD process](https://agentclientprotocol.com/rfds/about)
- ACP v2 Draft 공지(2026-07-20)는 "not … ship it by default in production until we are closer to stabilization"이라고 하며 v1-only 피어가 당분간 흔할 것이라고 본다. v2에서는 `session/update`가 턴 밖에서도 올 수 있고(prompt lifecycle "beyond the turn") 메시지 ID가 필수가 된다 — [ACP v2 draft](https://agentclientprotocol.com/announcements/acp-v2-draft)
- Subagent Sessions RFD(초안 2026-08-19, 최신 개정 2026-10-22, `unstable_subagents`): 자식 세션은 `session/update`의 `sessionUpdate: "subagent_update"`로 알린다. "Clients cannot prompt, queue, or steer a child", 허용되는 조작은 `capabilities.cancel`일 때의 `session/cancel`뿐이다. "Clients must not call `session/load` or `session/resume` on a child." 재접속은 부모를 통해서만 한다. Claude Code와 Codex 어댑터에서의 검증이 아직 남아 있다 — [ACP subagents RFD](https://agentclientprotocol.com/rfds/subagents)
- 어댑터: `@agentclientprotocol/claude-agent-acp`(0.95.0, Apache-2.0, 2026-10-24)는 "implements an ACP agent by using the official Claude Agent SDK"이고 `session/list`, replay가 있는 `session/resume`, `session/fork`, `session/close`, `session/delete`(v2), 자식 세션 형태의 서브에이전트, 대화형과 백그라운드 터미널, experimental v2(`CLAUDE_AGENT_ACP_PROTOCOL`)를 지원한다. 알려진 한계는 cancel해도 백그라운드 명령이 계속 돌고, Claude Code가 종료될 때 실행 중이던 자식이 `idle`로 보고되는 것이다 — [claude-agent-acp](https://github.com/zed-industries/claude-agent-acp), [npm](https://www.npmjs.com/package/@agentclientprotocol/claude-agent-acp)
- `@agentclientprotocol/codex-acp`(2.2.2, Apache-2.0)는 "starts the Codex App Server, translates ACP requests into Codex operations"이다. 인증은 ChatGPT 로그인, `CODEX_API_KEY`, `OPENAI_API_KEY`다. 네이티브 서브에이전트 세션은 클라이언트가 capability를 협상해야 하고, 협상하지 않으면 일반 tool call로 보인다 — [codex-acp](https://github.com/agentclientprotocol/codex-acp), [npm](https://www.npmjs.com/package/@agentclientprotocol/codex-acp)
- ACP 지원 에이전트 목록에는 Claude Agent(어댑터), Codex CLI(어댑터), Gemini CLI, GitHub Copilot(public preview), Cursor, Goose, OpenCode, Cline, Junie, Kiro CLI, Qwen Code, Factory Droid, OpenHands 등이 있다 — [ACP agents](https://agentclientprotocol.com/get-started/agents). ACP TS SDK는 `@agentclientprotocol/sdk` 2.0.2다 — [npm](https://www.npmjs.com/package/@agentclientprotocol/sdk)

### Inferences
- ACP는 (a) spawn, (b) 스트리밍 대시보드, 권한 UI, (f) 회수를 벤더 중립으로 만드는 어댑터 레이어로 쓸 가치가 있다. (c) 팝아웃과 (e) 에이전트 간 메시징은 ACP 범위 밖이다. 팝아웃하려면 ACP 세션을 `session/close`한 뒤 벤더 네이티브 TUI(`claude --resume`, `codex resume`)로 넘기는 hand-off가 필요하다.
- v1에는 턴 도중 steer가 없고 prompt가 턴 단위라서, 실행 중 지시 (d)는 cancel 후 새 prompt로 해야 한다. 네이티브 표면(SDK `streamInput`, Codex `turn/steer`)보다 약하다.

### Gaps
- claude-agent-acp의 ACP session ID와 Claude Code session ID가 1:1로 대응하는지, 즉 ACP로 만든 세션을 `claude --resume`으로 바로 열 수 있는지는 확인하지 못했다.
- session-fork RFD가 Draft인데 claude-agent-acp가 fork를 지원하는 것은 unstable 기능일 가능성이 높다(추론).

## 7. 기타 표면: Gemini CLI, coder/agentapi, A2A, MCP 조정 버스, SDK 멀티에이전트 패턴, 터미널 스크래핑

### Takeaway
Gemini CLI는 headless stream-json과 `--acp`를 갖춰 ACP 경로로 합류하기 쉽다. 터미널 스크래핑 계열의 대표였던 coder/agentapi는 2026-09-13에 아카이브되어 유지보수가 끝났다. A2A 1.0은 원격의 불투명한 에이전트용이라 로컬 하네스 내부 버스로는 과하다. 벤더를 섞는 팀의 조정은 "MCP 서버를 공유 태스크 보드와 메일박스로 쓰는" 패턴이 가장 실용적이다.

### Cited Findings
- Gemini CLI 0.49.0 로컬 도움말: `-p/--prompt`(headless), `-o/--output-format text|json|stream-json`, `--acp`("Starts the agent in ACP mode"; `--experimental-acp`는 deprecated), `-r/--resume latest|<index>`, `--session-id`, `--session-file`, `--list-sessions`, `--approval-mode default|auto_edit|yolo|plan`, `-w/--worktree` — [LOCAL: `gemini --help` 0.49.0]. 최신 npm 버전은 0.65.0이다 — [npm](https://www.npmjs.com/package/@google/gemini-cli)
- Gemini headless stream-json 이벤트는 `init`, `message`, `tool_use`, `tool_result`, `error`, `result`이고 exit code는 0, 1, 42(입력 오류), 53(턴 한도)이다. 같은 페이지에 "Unpaid tier and Google One users were moved from Gemini CLI to Antigravity CLI on June 18, 2026"라는 공지가 있다 — [Gemini CLI headless](https://geminicli.com/docs/cli/headless/)
- coder/agentapi는 "runs an in-memory terminal emulator"로 키 입력을 보내고 화면 diff로 메시지를 파싱한다. 엔드포인트는 `GET /messages`, `POST /message`, `GET /status`(`stable`/`running`), `GET /events`(SSE)다. TUI가 바뀌면 파싱 로직을 고쳐야 하고 TUI 요소가 섞일 수 있다고 스스로 밝힌다. "AgentAPI is deprecated and no longer maintained", 저장소는 2026-09-13에 아카이브됐다 — [coder/agentapi](https://github.com/coder/agentapi)
- Claude Code 분할 창 팀 모드는 tmux나 iTerm2가 필요하고 Windows Terminal에서는 지원되지 않는다 — [agent teams](https://code.claude.com/docs/en/agent-teams). Windows Terminal `wt.exe`가 제공하는 명령은 `new-tab`, `split-pane`, `focus-tab`, `move-focus`, `move-pane`, `swap-pane` 같은 실행과 레이아웃 명령뿐이다. `-w 0`은 가장 최근 창, `--title`, `-d`를 지원한다. PowerShell에서는 `;`를 이스케이프해야 하고, 문서화된 두 우회법을 쓰면 PowerShell이 새 터미널 창이 닫힐 때까지 기다린다 — [Windows Terminal CLI](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
- A2A: 최신 스펙은 1.0.0이다. 개념은 Agent Card, Task, Message, Part, Artifact, `contextId`이고 상태는 `TASK_STATE_SUBMITTED|WORKING|INPUT_REQUIRED|AUTH_REQUIRED|COMPLETED|FAILED|CANCELED|REJECTED`다. 바인딩은 JSON-RPC, gRPC, HTTP+JSON이고 메서드는 `SendMessage`, `SendStreamingMessage`, `SubscribeToTask`, `GetTask`, `ListTasks`, `CancelTask`, 푸시 알림 설정이다. 대상은 "potentially opaque AI agent systems"다 — [A2A spec](https://a2a-protocol.org/latest/specification/). Linux Foundation은 2026-04-09에 150개 이상 조직이 참여하고 있다고 발표했다 — [LF press](https://linuxfoundation.org/press/a2a-protocol-surpasses-150-organizations-lands-in-major-cloud-platforms-and-sees-enterprise-production-use-in-first-year)
- OpenAI Agents SDK의 패턴은 handoff(전문가가 그 턴의 활성 에이전트가 됨)와 agents-as-tools(`Agent.as_tool()`, 매니저가 통제 유지)이며 둘을 섞을 수 있다. LLM 오케스트레이션과 코드 오케스트레이션(구조화 출력 분기, 체이닝, 평가 루프, `asyncio.gather` 병렬)이 있다 — [OpenAI Agents SDK multi-agent](https://openai.github.io/openai-agents-python/multi_agent/). Claude Agent SDK에서 이에 해당하는 것은 `agents`(Agent 도구로 위임)와 대규모용 `Workflow` 도구다 — [SDK subagents](https://code.claude.com/docs/en/agent-sdk/subagents)
- MCP를 조정 버스로 쓰는 예가 MCP Agent Mail이다. 에이전트 신원, 메일박스, 스레드, 파일과 glob에 거는 권고적(advisory) 예약을 제공하고 Git과 SQLite에 저장하며, HTTP MCP로 기본 `127.0.0.1:8765`에서 돈다. Rust 재작성판은 Claude Code, Codex CLI, Gemini CLI 등을 지원한다고 밝히고 예약을 강제하는 pre-commit guard가 있다(검색 요약으로만 확인, 원문 미확인) — [mcp_agent_mail](https://github.com/Dicklesworthstone/mcp_agent_mail), [mcp_agent_mail_rust](https://github.com/Dicklesworthstone/mcp_agent_mail_rust)

### Inferences
- 터미널 스크래핑(tmux `send-keys`/`capture-pane`, agentapi)은 TUI가 바뀔 때마다 깨진다. Windows에는 tmux가 기본으로 없고 `wt.exe`에는 다른 탭의 입출력을 읽거나 쓰는 API가 없다. 따라서 팝아웃 창을 여는 데만 `wt`를 쓰고, 제어와 관찰은 구조화 표면(stream-json, app-server, hooks)으로 해야 한다.
- MCP 버스는 Claude, Codex, Gemini 모두가 MCP 클라이언트라서 유일한 벤더 중립 공통분모다. 태스크 보드(claim, lease, status)와 메일박스(to:role)를 하네스가 MCP 서버로 제공하면 (e)와 (f)를 벤더와 무관하게 해결할 수 있다. MCP는 pull 방식이라 에이전트가 도구를 호출해야 읽는다. 즉시 알림이 필요하면 Claude는 channel이나 SendMessage, Codex는 `turn/steer`로 보완한다.

### Gaps
- Gemini CLI ACP 모드가 session/load나 resume을 지원하는 범위는 확인하지 못했다.
- A2A를 로컬 CLI 에이전트에 붙인 공식 어댑터는 찾지 못했다.

## 8. 정책·ToS 제약: Claude Code와 Codex를 서드파티 앱으로 감싸기

### Takeaway
Anthropic은 구독(OAuth) 로그인을 "ordinary use of Claude Code and other native Anthropic applications"로 한정한다. Agent SDK를 포함해 제품을 만드는 개발자는 API key를 쓰라고 하며, 서드파티가 Claude.ai 로그인을 제공하거나 구독 자격으로 요청을 중계하는 것을 금지한다. 다만 "최종 사용자가 수정하지 않은 Claude Code 바이너리에 자기 구독으로 로그인"하는 것은 명시적으로 막지 않는다. OpenAI는 Codex CLI가 Apache-2.0이고 app-server에 `clientInfo`와 known-clients 체계가 있다. 2026-10에는 "Sign in with ChatGPT"로 파트너 도구에서 Plus/Pro 사용량을 쓰게 하는 프로그램을 시작했다.

### Cited Findings
- Anthropic 원문: "OAuth authentication is intended exclusively for purchasers of Claude Free, Pro, Max, Team, and Enterprise subscription plans and is designed to support ordinary use of Claude Code and other native Anthropic applications." "Developers building products or services that interact with Claude's capabilities, including those using the Agent SDK, should use API key authentication … Anthropic does not permit third-party developers to offer Claude.ai login into their own applications, or to route requests through Free, Pro, or Max plan credentials on behalf of their users. Moreover, developers may not collect, store, or intermediate Claude.ai credentials or session tokens." — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- 같은 문서의 예외 조항: "Nor does it prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription, including where a platform hosts Claude Code…". 제품에 Claude Code를 넣으려면 Commercial Terms에 동의해야 하고, "The Claude Code binary must not be modified" 및 인증 방식 제거 금지, "Customers may not pay for, resell, or intermediate Claude usage", 각 최종 사용자의 자기 자격 인증 조건을 지켜야 한다. "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK." Anthropic은 사전 통지 없이 집행할 수 있다고 밝혔다 — [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- `--bare` 모드는 OAuth와 키체인을 읽지 않고 API key만 쓴다 — [headless](https://code.claude.com/docs/en/headless). 백그라운드 세션은 구독 쿼터를 대화형 세션과 똑같이 소비한다 — [agent view](https://code.claude.com/docs/en/agent-view). Channels는 claude.ai 또는 Console API key 인증이 필요하다 — [channels](https://code.claude.com/docs/en/channels)
- 라이선스 필드: `@anthropic-ai/claude-code`와 `@anthropic-ai/claude-agent-sdk`는 "SEE LICENSE IN README.md", PyPI `claude-agent-sdk`는 MIT, `@openai/codex`와 `@openai/codex-sdk`는 Apache-2.0, ACP 어댑터 두 개는 Apache-2.0 — [npm claude-code](https://www.npmjs.com/package/@anthropic-ai/claude-code), [npm codex](https://www.npmjs.com/package/@openai/codex), [PyPI](https://pypi.org/project/claude-agent-sdk/)
- OpenAI app-server는 `clientInfo.name`을 Compliance Logs에 쓰고, 엔터프라이즈 통합은 known clients 목록 등록을 위해 연락하라고 한다. `chatgptAuthTokens`(호스트 토큰 주입)는 experimental이다. app-server와 ws는 프로덕션 미지원이다 — [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- OpenAI "Sign in with ChatGPT"(2026-10-02 보도): 16개 파트너로 시작했고 Plus/Pro 구독자가 참여 도구에서 자기 플랜 사용량을 쓰며, 도구별 사용 한도를 정할 수 있다. 공개된 파트너는 Cognition, Notion, Lovable, Vercel, OpenClaw, T3, Dactyl이다. 개발자 신청 절차는 기사에 없다 — [IT Brief](https://itbrief.co.uk/story/openai-launches-chatgpt-sign-in-for-16-partner-tools), [The New Stack(헤드라인)](https://thenewstack.io/sign-in-with-chatgpt/)

### Inferences
- 사용자 본인 PC에서 하네스가 수정하지 않은 `claude` 바이너리를 띄우고, 사용자가 Anthropic 자체 흐름으로 직접 로그인한 상태를 쓰며, 하네스가 자격 증명을 수집하거나 저장하지 않는 형태는 예외 조항에 가장 가깝다. 반면 하네스 제품이 Agent SDK에 구독 OAuth를 태우는 구성은 문서가 API key를 요구하는 영역에 정면으로 해당한다. 배포 제품이라면 기본은 BYO API key로, 구독 경로는 "사용자가 띄운 CLI 세션에 attach하는" 방식으로 한정하는 편이 안전하다. 법률 판단이 아니므로 Anthropic sales 문의를 권한다.
- 병렬 역할 에이전트 N개는 쿼터를 N배로 쓴다. "ordinary, individual usage" 전제와 충돌할 수 있으니 동시 실행 수를 조절하고 비용과 쿼터를 표시하는 기능이 제품에 필요하다.
- OpenAI 쪽은 Codex CLI를 감싸는 것 자체는 라이선스상 자유롭다. 그러나 ChatGPT 구독 사용량을 서드파티 제품에서 쓰는 공식 경로는 파트너 프로그램이고 일반 개발자 개방 여부는 불명확하다. 자세한 내용은 OpenAI/Codex 담당 노트를 참조한다.

### Gaps
- OpenAI의 1차 약관 문서(ChatGPT 자격을 서드파티 하네스에서 쓰는 것에 대한 명시 조항)는 찾지 못했다.
- 개인용 도구에서 사용자가 자기 구독으로 로그인한 CLI를 오케스트레이션하는 것이 "ordinary use"인지에 대한 Anthropic의 공식 해석은 없다.

## 9. 권장 아키텍처: "한 명령으로 에이전트 X를 컨텍스트째 새 창으로 꺼내되 팀에는 계속 연결", (a)~(f) 매트릭스, 하드 한계

### Takeaway
가장 견고한 패턴은 "하네스가 최상위 세션들을 관리하는 supervisor 역할을 하고, 팝아웃은 벤더 네이티브 attach로, 팀 조정은 MCP 버스와 SendMessage로" 하는 것이다. 핵심 원칙은 팝아웃할 가능성이 있는 역할은 절대 세션 내부 서브에이전트로 만들지 말고 처음부터 독립 세션으로 띄우는 것이다. Claude는 `claude --bg`로 띄우고 `claude attach`로 꺼낸다. 같은 live 프로세스라 컨텍스트가 100% 보존되고, detach하면 다시 팀으로 돌아가므로 재병합이 필요 없다. Codex는 하네스가 소유한 app-server의 thread에 `codex resume <id> --remote`로 붙인다(실험적). 대시보드는 `claude agents --json`, 세션별 `http` hooks, app-server 알림으로 채운다.

### Cited Findings
- Claude 팝아웃의 근거: `claude attach <id>`는 실행 중인 세션 프로세스에 완전한 대화형 세션으로 붙고 detach해도 멈추지 않는다 — [agent view](https://code.claude.com/docs/en/agent-view). 실행 중인 bg 세션에 `claude --resume <id>`를 걸면 attach로 처리되어 이중 writer가 생기지 않는다(v2.1.285 이상) — [sessions](https://code.claude.com/docs/en/sessions). 새 탭은 `wt -w 0 nt --title <name> <commandline>`으로 연다 — [Windows Terminal CLI](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
- 팀 연결 유지의 근거: bg 세션과 `-p` 세션은 inbox socket을 바인딩해 이름(`--name`)으로 `SendMessage`를 받는다. native Windows는 named pipe다 — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging). 세션 프로세스가 그대로이니 MCP 서버 연결과 hooks도 유지된다(같은 프로세스) — [agent view](https://code.claude.com/docs/en/agent-view)
- Codex 팝아웃 근거: `codex --remote <ws|unix URL>`과 `codex resume … --remote`([LOCAL: `codex resume --help`]), app-server의 다중 구독 정황(`thread/unsubscribe` "last subscriber"), `turn/steer`, `thread/inject_items` — [Codex App Server](https://learn.chatgpt.com/docs/app-server)
- 서브에이전트 팝아웃이 불가능한 근거: Claude 문서는 서브에이전트를 별도 세션으로 여는 방법을 제공하지 않는다 — [sub-agents](https://code.claude.com/docs/en/sub-agents). ACP RFD는 자식 세션 load, resume, prompt를 금지한다 — [ACP subagents RFD](https://agentclientprotocol.com/rfds/subagents)

### Inferences
**권장 구성(Windows 11, Claude Code 우선, Codex 혼합)**
1. 역할 정의: `.claude/agents/<role>.md`(Claude)와 `.codex/agents/<role>.toml`(Codex)에 PM, researcher, synthesizer를 정의한다. 하네스 공용 설정 `harness-settings.json`에는 다음을 넣는다. ① `http` hooks(SessionStart, Stop, SubagentStop, Notification, TaskCompleted, PostToolUse async)를 `http://127.0.0.1:<port>/hook`으로 보내기 ② `crossSessionInbound: "accept"` ③ 리서치 역할은 `worktree.bgIsolation` 정책 명시. 설정은 `--mcp-config`로 MCP 팀 버스(태스크 보드와 메일박스)도 연결한다.
2. Spawn (a): `claude --bg --name pm --agent pm --settings harness-settings.json --mcp-config team-bus.json "<spawn prompt 또는 '@brief.md 읽고 시작'>"`를 역할마다 실행한다. 사전에 workspace trust가 필요하다(스크립트에서는 `Workspace not trusted`로 실패). Codex 역할은 하네스가 띄운 `codex app-server --listen ws://127.0.0.1:<p>`에 `thread/start`와 `turn/start`를 보낸다(대안은 `codex exec --json`).
3. 대시보드 (b): `claude agents --json --all` 폴링(상태와 waitingFor), hooks POST(세션별 이벤트, `transcript_path`), 필요하면 `claude logs <id>`를 쓴다. Codex는 `item/*`, `turn/*` 알림을 쓴다. JSONL 직접 파싱은 표시용으로만 한다.
4. 팝아웃 (c), 한 명령: `harness pop <role>` 한 번으로 이름을 ID로 바꾼 뒤(`claude agents --json`에서 `name`, `id`) `wt -w 0 nt --title <role> claude attach <id>`를 실행한다. Codex는 `wt -w 0 nt --title <role> codex resume <threadId> --remote ws://127.0.0.1:<p>`다. 하네스에서는 PowerShell 인라인 대신 `wt.exe`를 인자 배열로 detached 실행해야 `;` 이스케이프 문제와 PowerShell 대기 문제를 피한다. 데스크톱 앱을 쓰고 싶다면 `claude --desktop --resume <id>`도 선택지지만, 실행 중 bg 세션과의 상호작용은 미검증이다.
5. 실행 중 지시 (d): 사용자는 팝아웃 탭에서 직접 입력한다(작업 중이면 큐에 쌓임). 하네스와 다른 에이전트는 MCP 메일박스나 Claude `SendMessage`로 보낸다. 즉시 push가 필요하면 channel(research preview, 커스텀은 dev 플래그)을 쓴다. Codex는 `turn/steer`다.
6. 에이전트 간 (e): Claude끼리는 `SendMessage`/`ListAgents`(같은 머신, 이름 주소)를 쓰고, 벤더를 섞으면 MCP 태스크 보드(claim과 lease)와 메일박스를 쓴다. 파일 충돌은 worktree 격리나 권고적 예약으로 다룬다.
7. 결과 회수 (f): 각 역할이 synthesizer 세션(`--name synth`)에 SendMessage하거나 보드에 결과를 게시한다. 하네스는 Stop hook이나 `turn/completed`로 완료를 감지하고 필요하면 synthesizer에 요약을 주입한다(Claude는 MCP나 SendMessage, Codex는 `thread/inject_items`). 실행 중인 synth에 `claude -p --resume`을 쓰면 안 된다(이중 writer, 또는 bg면 exit 1).
8. 재병합 의미론: attach 모델에서는 같은 세션이라 재병합이 필요 없다. hand-off 모델(SDK/-p/exec)에서는 TUI 종료 후 같은 ID로 다시 resume하면 사용자와의 대화가 이미 트랜스크립트에 있다. fork 모델(`--fork-session`, `thread/fork`)에서는 팀 사본을 보존하고, 돌아온 뒤 사본의 새 턴 요약을 팀에 주입한다.

**(a)~(f) 매트릭스**(✓ 문서화된 수단으로 가능, △ 부분 가능 또는 우회, ✗ 불가)

| 표면 | (a) N개 spawn | (b) 대시보드 스트림 | (c) 컨텍스트째 팝아웃 | (d) 실행 중 지시 | (e) 에이전트 간·보드 | (f) 종합으로 회수 |
|---|---|---|---|---|---|---|
| 세션 내 서브에이전트(현재 방식) | ✓(동시 20, 깊이 3) | △ headless `parent_tool_use_id`, `--forward-subagent-text` / 대화형 패널 | ✗(패널에서 트랜스크립트에 입력하는 것만 가능) | △ `SendMessage`로 이름 재개 | △ 이름 있는 서브에이전트끼리 | ✓ 네이티브 |
| Agent teams(실험) | ✓ 대화형만 | △ 패널, 분할 창은 Windows Terminal 불가 | △ 같은 창에서만 | ✓ 선택 후 입력 | ✓ 메일박스, 태스크 락 | ✓ 리드가 종합 |
| Claude bg 세션 + attach(preview) | ✓ `--bg` | ✓ `agents --json`, http hooks | ✓ `claude attach`(live) | △ attach 입력, SendMessage, channel | ✓ SendMessage, MCP 버스 | ✓ |
| Claude `-p`/SDK 세션 | ✓ | ✓ typed stream | △ hand-off 또는 fork | ✓ `streamInput`, `interrupt` | △ MCP, 비bare면 inbox | ✓ |
| Codex exec | ✓ | ✓ JSONL | △ 실행 후 `codex resume` | ✗ 턴 단위 | △ MCP | ✓ |
| Codex app-server(실험) | ✓ thread | ✓ 알림 | △~✓ `--remote` TUI(다중 구독 미검증) | ✓ `turn/steer` | △ MCP, 스레드 트리 내 collab | ✓ `inject_items` |
| ACP 어댑터 | ✓ | ✓ `session/update` | ✗ attach 개념 없음 | △ cancel 후 재prompt(v1) | ✗ | ✓ 하네스 |
| tmux, agentapi 스크래핑 | ✓ | ✗ 취약 | Windows에서 △ | ✗ 취약 | ✗ | ✗ |

**하드 한계(설계 전제로 받아들일 것)**
- 세션 내 서브에이전트를 독립 대화형 세션으로 바꾸는 문서화된 방법이 없다(Claude). ACP는 자식 세션 load, resume, prompt를 금지한다. Codex 서브에이전트 스레드의 독립 resume은 미확인이다.
- 한 세션에는 writer가 하나여야 한다. 두 프로세스가 같은 세션을 쓰면 트랜스크립트가 섞인다. bg 세션에만 거부와 attach 보호가 있고, SDK/-p/Codex는 하네스가 lease를 강제해야 한다.
- 비대화형으로 "실행 중인 bg 세션에 텍스트를 보내는" CLI가 없다. socket 메시지 형식은 문서에 없고, channels는 research preview이며 허용 목록 제약이 있다(커스텀은 `--dangerously-load-development-channels`).
- Agent view, bg 세션, channels, agent teams는 research preview 또는 실험 단계다. `~/.claude/jobs/*/state.json`, `roster.json`, 팀 파일, JSONL 포맷은 파싱 금지 또는 내부용이다. idle 상태로 약 1시간 attach되지 않은 세션은 프로세스가 정지된다(attach하면 트랜스크립트에서 재시작, `Ctrl+T`로 고정).
- Codex app-server와 ws transport는 실험 단계라 프로덕션 미지원이다. Windows에서 데몬은 미지원(로컬 확인)이고 스키마는 버전마다 다르다. 로컬 0.144.5는 최신 0.164.0보다 뒤처져 있다.
- 쿼터: 역할 N개를 병렬로 돌리면 N배로 소모한다. 구독 OAuth를 제품 내부에서 중계하는 것은 정책 위반 소지가 있다(8절).
- Windows 특이사항: WSL 세션과 native Windows 세션은 서로 메시지를 주고받지 못한다. tmux 분할 창 팀 모드는 Windows Terminal에서 불가능하다. bg로 격리된 세션은 끝날 때 자동으로 push하고 draft PR을 연다(정책 설정 필요).

### Gaps
- 실험으로 검증할 항목은 다음과 같다. ① Windows에서 `claude --bg`와 `--settings`/`--mcp-config`를 함께 쓸 수 있는지, 그리고 `wt … claude attach` 왕복 ② attach 중에 다른 세션의 `SendMessage`가 전달되는 방식 ③ Windows에서 `codex app-server --listen ws://127.0.0.1:<p>`와 `codex resume <id> --remote`로 하네스와 TUI가 같은 스레드를 동시에 구독할 수 있는지 ④ SDK로 만든 세션을 `claude --resume`으로 연 뒤 SDK가 resume할 때의 충돌 동작 ⑤ 서브에이전트 JSONL을 `--resume`으로 열 수 있는지.
- 백그라운드 세션 동시 실행 수와 Codex `agents.max_concurrent_threads_per_session` 기본값에 대한 공식 수치는 찾지 못했다.
