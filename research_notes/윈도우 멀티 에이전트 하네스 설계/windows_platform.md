# Windows 11 멀티 에이전트 하네스의 플랫폼 빌딩 블록 (터미널 · 멀티플렉서 · PTY · 창/알림 API), 2026-10-25 기준

> 범위: Windows 11에서 "명령 하나로 특정 AI 에이전트 세션을 자기 탭/pane/창으로 띄우고(앞으로 가져오기 포함), 여러 세션을 정리하고, 에이전트가 사람을 기다릴 때 알려 주는" 도구를 만들 때 쓸 수 있는 기술 요소를 정리했다.
> 표기: ✅ = 공식 문서/릴리스 노트에서 플래그·동작을 확인함. [미검증] = 존재할 가능성은 높지만 이번 조사에서 1차 출처로 확인하지 못함. 2026년 이전 출처는 "(2026 이전 문서)"로 표시했다.
> 사용자 환경 메모: Windows 11 Home 10.0.26300, PowerShell, Claude Code CLI·데스크톱 앱, Codex CLI, 한국어 IME.

## 1. Windows Terminal(wt.exe): 2026년 명령줄 기능, 외부 자동화 범위, JSON fragment

### Takeaway
wt.exe는 "보내기만 하는(fire-and-forget)" CLI다. 새 탭·분할·탭/pane 포커스 이동·창 지정(`-w` 번호/이름)은 되지만, 탭·pane 목록 조회, 특정 pane에 입력 보내기, pane 닫기, 활성 pane 조회는 2026-10-02에 나온 최신 릴리스(1.25 stable, 1.26 preview)에도 없다. 2026년 추가분은 창 상태 복원, workspaces(1.26 preview), OSC 777 데스크톱 알림과 벨 알림(1.26 preview, 기본 꺼짐), IME 수정이다. 하네스는 WT를 "보기 계층"으로만 쓰고, 어떤 에이전트가 어느 창/탭에 있는지는 직접 기록해야 한다.

### Cited Findings
**명령줄 문법과 전역 옵션** (모두 ✅, 출처: [MS Learn: Windows Terminal command line arguments, ms.date 2025-11-10](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments))
- 문법은 `wt [options] [command ; ]`이다. 명령을 생략하면 `new-tab`이 기본이다. `windowingBehavior` 설정이 "새 창으로 열지, 새 탭으로 열지"의 기본값에 영향을 준다.
- 전역 옵션: `--help, -h, -?, /?` / `--maximized, -M` / `--fullscreen, -F` / `--focus, -f` / `--pos x,y` / `--size c,r` (열·행 수) / `--window, -w window-id`.
  - 주의: `--focus`는 "focus mode"(탭줄·제목줄을 숨기는 모드)로 실행하는 옵션이다. 창을 앞으로 가져오는 기능이 아니다.
- `-w` 값: 창의 정수 ID나 창 이름. 예약값 `new` 또는 `-1`은 항상 새 창, `last` 또는 `0`은 "the most recently used window"다. 해당 ID/이름의 창이 없으면 그 이름으로 새 창을 만든다. `wt -w _quake`는 quake 창을 연다.
  - 문서 안의 불일치: 옵션 표는 `0`을 "가장 최근에 사용한 창"이라 하고, 예시 주석은 `wt -w 0 nt`를 "Open a new tab ... in the current window"라고 설명한다. WT 안에서 실행하면 보통 같은 창이지만, 백그라운드 프로세스에서 호출하면 다를 수 있다.
- **new-tab (`nt`)**: `--profile, -p` / `--startingDirectory, -d` / `--title` / `--tabColor` (#RGB 또는 #RRGGBB) / `--suppressApplicationTitle` / `--useApplicationTitle` / `--colorScheme` / `--appendCommandLine` / `--inheritEnvironment, !--reloadEnvironment` (commandline을 넘기면 기본으로 켜짐) / `commandline`.
- **split-pane (`sp`)**: `-H, --horizontal` / `-V, --vertical` / `--profile, -p` / `--startingDirectory, -d` / `--title` / `--tabColor` / `--size, -s` (부모 pane 대비 비율, 예: `.4`) / `commandline` / `--duplicate, -D` / `--suppressApplicationTitle` / `--useApplicationTitle` / `--colorScheme`.
- **focus-tab (`ft`)**: `--target, -t tab-index` 하나뿐이다. 탭 제목이나 ID로는 포커스할 수 없다.
- **move-focus (`mf`)**: `up|down|left|right|first|previous|nextInOrder|previousInOrder`.
- **move-pane (`mp`)**: `--tab, -t <index>` (0부터 셈).
- **swap-pane**: move-focus와 같은 방향 값을 쓴다.
- 문서의 "Options and commands" 전체 목록은 위 6개 서브커맨드(new-tab, split-pane, focus-tab, move-focus, move-pane, swap-pane)가 전부다. 목록 조회, 입력 전송, pane 닫기 명령은 없다.
- `--tabColor`는 탭의 첫 pane에 묶인다. 여러 pane이 있으면 첫 pane에 포커스가 있을 때만 그 색이 보이므로 `split-pane`에도 `--tabColor`를 따로 줘야 한다. 탭 제목은 포커스된 pane의 제목을 따른다.
- PowerShell에서는 `;`가 문장 구분자라 backtick으로 이스케이프(`` `; ``)하거나 `--%`를 써야 한다. 문서에 따르면 이 방법들은 "aren't currently recommended"인데, PowerShell이 Store 앱(Windows Terminal 포함)이 닫힐 때까지 기다리기 때문이다.
- WSL 안에서는 execution alias가 동작하지 않는다. `cmd.exe /c "wt.exe" ...`로 부르고, 구분자는 `\;`로 쓴다.
- `wt.exe`는 "app execution alias"이고, PATH에 `%LOCALAPPDATA%\Microsoft\WindowsApps`가 있어야 한다.

**외부 자동화 부재 (커뮤니티 확인)**
- Claude Code 이슈 #24384(2026-02-09 등록, 2026-08-17 라벨 변경 시점까지 open)는 WT를 teammate 백엔드로 쓸 때의 공백을 정리했다. tmux `list-panes`에 해당하는 기능이 없어 내부에서 추적해야 하고, pane ID를 주는 env var가 없어 제목이나 생성 순서로 추적해야 한다. pane 포커스는 방향 기반 `move-focus`뿐이고, pane에 입력을 보낼 방법이 없어 파일 기반 IPC를 제안했다. pane 닫기는 다루지 않았다. WT 안에서 실행 중인지는 `WT_SESSION` env var로 감지하자고 제안했다. — [GitHub anthropics/claude-code#24384](https://github.com/anthropics/claude-code/issues/24384)

**2026 릴리스 (자동화/IPC 관점)**
- **v1.25.2733.0 (stable, 2026-10-02)**: 페이지에는 "02 Oct"만 표시되고, 연도는 빌드 번호 1.25.260930003으로 추정했다. 설정 검색, actions editor, Kitty keyboard protocol, 스크롤백 포함/미포함 창 복원("Window persistence with _or without_ the scrollback history"), `firstWindowPreference` 값으로 `persistedLayoutAndContent` 인정, CJK 콘솔 앱 호환을 위한 ambiguous-width 문자 폭 설정, IME 수정(최대화 시 후보창 위치 #20627, 조합 중 화살표 키 미전송 #20471), ConPTY 변경(응답 없는 커서 위치 요청을 재시도하지 않음 #20510, DA1 응답을 기다리지 않음 #20536), fragment extension 앱 카탈로그 조회 가속(#20356). Insider Dev/Canary/Beta 채널부터 배포한다. — [Release v1.25.2733.0](https://github.com/microsoft/terminal/releases/tag/v1.25.2733.0)
- **v1.26.2734.0 (preview, 2026-10-02)**: "workspaces"(닫았다가 다시 열 수 있고 열려 있던 것을 기억하는 이름 있는 창, 탭 목록 왼쪽 아이콘에서 접근), OSC 777 알림(기본 꺼짐, `$profile.compatibility.allowOSC777`), 벨이 울릴 때 알림을 띄우는 `bellStyle` 값 `notification`(기본 꺼짐), Tab Search 미리보기, 창별 설정 기반 작업, OSC 7 지원 재제거. 노트에 새 스크립팅/IPC 기능은 없고, workspaces와 `wt -w` 이름의 관계도 적혀 있지 않다. — [Release v1.26.2734.0](https://github.com/microsoft/terminal/releases/tag/v1.26.2734.0)
- 2026 릴리스 전체에서 wt.exe 쪽 변경은 인식하지 못한 인자에 대한 `wt --help` 개선과 "Open New Window"가 execution alias 고장에 영향받지 않게 한 수정 정도다. — [microsoft/terminal releases](https://github.com/microsoft/terminal/releases)
- OSC 777 알림은 PR #20012가 머지되면서 이슈 #7718이 2026-06-04에 닫혔다. 같은 이슈에서 WT가 이미 ConEmu의 OSC 9;4를 처리하고 있다는 언급이 있다. — [microsoft/terminal#7718](https://github.com/microsoft/terminal/issues/7718)

**Actions (설정 파일 안 키 바인딩/명령 팔레트용. 외부 API가 아니다)** — 출처: [MS Learn: Windows Terminal Actions, ms.date 2024-05-08 (2026 이전 문서)](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions)
- `sendInput`(예: `{ "command": { "action": "sendInput", "input": "\u001b[A" } }`), `renameWindow`(`"name": "Foo"`), `exportBuffer`가 있다. 키나 명령 팔레트로만 실행되며, 외부 프로세스가 호출할 수 없다.
- `globalSummon`: `name`을 주면 그 이름/ID의 창을 불러오고, 없으면 그 이름으로 새 창을 만든다. `desktop`(`any|toCurrent|onCurrent`), `monitor`(`any|toCurrent|toMouse`), `toggleVisibility`(기본 true, false면 앞으로 가져오기만 함), `dropdownDuration`을 받는다. `quakeMode`는 `name: "_quake"`인 globalSummon의 축약이다.
- globalSummon 주의사항: `RegisterHotKey`를 쓰므로 다른 앱이 이미 등록한 키는 받지 못한다. 관리자/일반 인스턴스, Preview/Stable 인스턴스는 같은 키를 동시에 등록할 수 없고 먼저 실행된 쪽이 이긴다. 터미널이 실행 중일 때만 동작한다(`startOnUserLogin` 참고).

**진행률·벨**
- OSC 9;4(ConEmu 진행률 시퀀스)는 탭 헤더의 진행 링과 Windows 작업 표시줄 진행 표시로 나타난다. WT v1.6 이상이고, state 0~4(0=해제, 3=indeterminate)를 쓴다. — [MS Learn: progress bar sequences (로케일 미러)](https://learn.microsoft.com/el-gr/windows/terminal/tutorials/progress-bar-sequences)
- `bellStyle`(stable 문서 기준) 값은 `"all"`, `"audible"`, `"window"`, `"taskbar"`, `"none"`이고 기본은 `"audible"`이다. `"all"`은 소리를 내고 작업 표시줄 아이콘을 깜빡이며, 포커스가 없을 때는 아이콘만 깜빡인다. — [MS Learn: Advanced profile settings, ms.date 2022-04-13, 갱신 2025-08-21 (2026 이전 문서)](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/profile-advanced). 1.26 preview에 `notification` 값이 추가됐다(위 릴리스 참고).

**JSON fragment extensions** (✅ [MS Learn: JSON Fragment Extensions, ms.date 2025-11-10](https://learn.microsoft.com/en-us/windows/terminal/json-fragment-extensions))
- 위치: 사용자별 `C:\Users\<user>\AppData\Local\Microsoft\Windows Terminal\Fragments\{app-name}\{file-name}.json`, 전체 사용자 `C:\ProgramData\Microsoft\Windows Terminal\Fragments\{app-name}\{file-name}.json`. 폴더 안의 모든 .json을 읽는다.
- 구조는 `"profiles"`와 `"schemes"` 두 리스트다. 기존 프로필 수정은 `"updates": "{GUID}"`로 하며 기본 프로필(Command Prompt, PowerShell)과 동적 프로필만 수정할 수 있다. 새 프로필은 `name`이 필수다.
- GUID는 UUIDv5로 만든다. fragment용 namespace `{f65ddb7e-706b-4499-8a50-40313caf510a}`에 앱 이름(UTF-16LE)을 넣어 앱 namespace를 만들고, 거기에 프로필 이름을 넣는다.
- PowerShell로 생성할 때는 UTF-8로 써야 한다(`Out-File -Encoding Utf8`). PowerShell 기본값인 UTF-16LE로 쓰면 WT가 읽지 못한다.
- 1.24부터 fragment 폴더 기준 상대 경로로 아이콘/배경 이미지를 배포할 수 있다(프로필과 action의 `icon` 포함).

### Inferences
- WT는 상태를 조회할 수 없으므로 하네스가 레지스트리(에이전트 이름 → 세션 ID/이름, cwd/worktree, WT 창 이름, 생성 당시 탭 인덱스)를 직접 유지해야 한다. 사용자가 탭을 옮기거나 닫으면(1.25부터 탭을 닫으면 MRU 탭으로 이동) 인덱스가 틀어진다. 그래서 탭 인덱스보다 **이름 있는 창**(`-w agents`, `-w agent-<name>`)을 안정적인 핸들로 쓰는 편이 낫다.
- fragment로 "Agent: PM", "Agent: Research-A" 같은 프로필(commandline, startingDirectory, tabTitle, tabColor, icon)을 설치해 두면 `wt -w agents nt -p "Agent: PM"`처럼 짧게 띄울 수 있다. 프로필 commandline이 고정이라 세션 이름이 바뀌는 경우에는 맞지 않는다.
- Claude Code는 세션 이름과 상태 글리프를 탭 제목에 쓴다(5절). 이 신호를 살리려면 `--suppressApplicationTitle`을 쓰지 않는 편이 낫다. 하네스가 정한 제목을 고정하려면 반대로 써야 하므로 둘 중 하나를 골라야 한다.
- UI Automation(접근성 API)으로 WT 탭 목록을 읽는 방법도 이론상 가능할 수 있으나 조사하지 않았다. [미검증]

### Gaps
- `wt -w <기존 창>`으로 명령을 보냈을 때 그 창이 foreground로 올라오는지 문서에 없다. SetForegroundWindow 제약(5절) 때문에 호출 맥락에 따라 다를 수 있어 실측이 필요하다.
- 1.26 workspaces를 `wt -w <workspace-name>`으로 지정할 수 있는지, 복원된 탭이 commandline을 다시 실행하는지 불명확하다.
- `windowingBehavior`의 정확한 값 목록은 가져오지 못했다.
- 1.26이 OSC 777 외에 OSC 9 알림도 처리하는지는 릴리스 노트에 없다.
- fragment로 actions/키 바인딩을 배포할 수 있는지 명확하지 않다(문서 구조 예시는 profiles/schemes만 있고, 1.24 리소스 절에서 action icon을 언급한다).

## 2. Claude Code agent teams split-pane 표시 모드: 2026년 Windows Terminal 지원 여부, 네이티브 Windows 동작, 커뮤니티 우회책

### Takeaway
2026-10 공식 문서 기준 split-pane 모드는 tmux 또는 iTerm2(`it2` CLI)만 지원하고, "Windows Terminal, VS Code 통합 터미널, Ghostty에서는 지원되지 않는다"고 명시돼 있다. 네이티브 Windows에서는 기본값인 in-process 모드로 돈다(에이전트 패널에서 ↑/↓ 후 Enter). 우회책은 psmux(네이티브 Windows tmux 호환 멀티플렉서), WSL2 + tmux, WT에서 수동 분할 후 각각 `claude` 실행이다. WT 백엔드 요청(#24384)은 열려 있고 Anthropic의 실질 답변은 없다.

### Cited Findings
- Agent teams는 실험 기능이며 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`(env 또는 settings.json `env`)로 켠다. 대화형 세션에서만 팀원을 만들고, `-p`·Agent SDK에서는 만들지 않는다. — [Claude Code Docs: Agent teams](https://code.claude.com/docs/en/agent-teams)
- 표시 모드: "In-process"는 모든 팀원이 메인 터미널 안에서 돌고 "any terminal"에서 동작한다. "Split panes"는 "Requires tmux, or iTerm2"다. `teammateMode` 값은 `"in-process"`(기본), `"auto"`(tmux 세션 안이거나 it2가 있는 iTerm2일 때만 split, 아니면 in-process), `"tmux"`, `"iterm2"`. 세션 단위 플래그 `claude --teammate-mode auto`는 실험 기능이라 `--help`에 나오지 않는다. — [Agent teams](https://code.claude.com/docs/en/agent-teams), [CLI reference](https://code.claude.com/docs/en/cli-reference)
- 문서 원문: "Split-pane mode isn't supported in VS Code's integrated terminal, Windows Terminal, or Ghostty." 또 "`tmux` has known limitations on certain operating systems and traditionally works best on macOS." — [Agent teams](https://code.claude.com/docs/en/agent-teams)
- 내부 구조: 팀 설정 `~/.claude/teams/{team-name}/config.json`에 세션 ID와 tmux pane ID 같은 런타임 상태가 들어간다. 메일박스는 `~/.claude/teams/{team-name}/inboxes/{agent-name}.json` 파일이다. 제약: `/resume`·`/rewind`는 in-process 팀원을 복원하지 않는다. 세션당 팀은 하나이고 중첩 팀은 없으며 리더는 고정이다. — [Agent teams](https://code.claude.com/docs/en/agent-teams)
- `--tmux` 플래그는 worktree용 tmux 세션을 만든다. `--worktree`가 필요하고, iTerm2 네이티브 pane이 있으면 그것을 쓴다(`--tmux=classic`은 전통 tmux). 예: `claude -w feature-auth --tmux`. — [CLI reference](https://code.claude.com/docs/en/cli-reference)
- **#24384 "Add Windows Terminal as a split-pane backend"**: 2026-02-09 등록, open. 라벨은 `area:agents, area:core, area:tui, enhancement, platform:windows`. Anthropic의 실질 답변은 없다(2026-08-17 bcherny가 라벨만 추가). 제안 내용은 `WT_SESSION`으로 감지하고 `wt -w 0 split-pane -V -d ... --title ...`로 생성하는 것이다. 댓글에 소개된 우회책은 psmux, WSL+tmux, 수동 WT 분할(`Alt+Shift+D` 등), VS Code 확장, 훅 기반 PowerShell 스크립트(네이티브 Task 생성 경로에는 끼어들 수 없음)다. 관련 요청으로 WezTerm(#23574), Zellij(#24122), Ghostty(#24189)가 있다. — [GitHub #24384](https://github.com/anthropics/claude-code/issues/24384)
- 같은 이슈에서 psmux 메인테이너가 남긴 내용(2026-04-08): psmux는 `TMUX`, `TMUX_PANE`, `PSMUX_SESSION`을 설정한다. v0.4.10에서 많은 문제가 고쳐졌고 `--teammate-mode tmux`가 Windows에서 psmux로 동작한다. 남은 문제는 Claude Code가 모든 팀원에 split pane 하나를 재사용하는 것과 git worktree 지원이다. — [GitHub #24384](https://github.com/anthropics/claude-code/issues/24384)
- #26244: Windows에서 settings.json의 `"teammateMode": "tmux"`가 조용히 무시됐다. Bun으로 패키징한 바이너리에서 `process.stdout.isTTY`가 undefined였기 때문이고, 2026-03-23에 닫혔다. — [claudeissues 미러 #26244](https://claudeissues.com/issue/26244-split-pane-agent-teams-blocked-on-windows-by-istty-gate-overriding-teammatemode)
- #34150: psmux를 tmux 백엔드로 지원해 달라는 제안이다(감지/게이팅 로직만 조금 바꾸면 된다는 주장). — [claudeissues 미러 #34150](https://claudeissues.com/issue/34150-support-tmux-agent-teams-on-windows-via-psmux-native-windows-terminal-multiplexe). WT split 지원 중복 요청 #31297은 2026-03-06 등록 당일에 닫혔고 이유는 확인하지 못했다. — [claudeissues 미러 #31297](https://claudeissues.com/issue/31297-feature-agent-teams-add-windows-terminal-split-pane-support)
- **psmux의 Claude Code 연동 방식**(✅ [psmux docs/claude-code.md](https://github.com/psmux/psmux/blob/master/docs/claude-code.md)):
  - PowerShell 7+가 필요하다(env shim과 teammate-mode 주입 때문에 5.1은 미지원). psmux pane 안에서 대화형 `claude`를 실행해야 한다.
  - pane마다 `TMUX`(경로 `/tmp/psmux-{pid}/...`), `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `PSMUX_CLAUDE_TEAMMATE_MODE=tmux`가 자동으로 들어간다.
  - `claude` 래퍼 함수가 `--teammate-mode tmux`를 덧붙인다. 어느 settings 파일에도 `teammateMode`가 없을 때만 그렇게 하며, 프로필에 이미 `claude`나 `env`가 정의돼 있으면 건드리지 않는다.
  - Claude Code TmuxBackend가 쓰는 명령: `new-session`, `split-window`, `send-keys`, `respawn-pane`, `set-option -p`, `show-options -p`. 설정은 `set -g claude-code-fix-tty on`(기본).
  - 알려진 문제: Agent View를 열면 플래그 없이 다시 실행돼 in-process로 돌아간다(#578, settings에 `"teammateMode": "tmux"`를 두면 피할 수 있음). `isolation: "worktree"` 에이전트는 보이지 않게 in-process로 돈다. 빌드 22523 미만에서는 마우스 휠이 전달되지 않는다. 3.3.8 이하에서는 공백이 든 경로가 깨진다(#634).
- WSL2 + tmux로 agent teams pane을 보는 커뮤니티 가이드가 있다. — [ardalis: Setting up Claude Code agent teams with WSL2 and tmux on Windows](https://ardalis.com/setting-up-claude-code-agent-teams-with-wsl2-and-tmux-on-windows/)

### Inferences
- in-process 팀원은 리더 프로세스 안에 살고 `/resume`으로도 복원되지 않는다. 따라서 "에이전트 X를 따로 떼어 직접 대화하기(컨텍스트 유지)"에는 맞지 않는다. 팝아웃 대상은 처음부터 **독립 세션**(이름 있는 세션이나 7절의 background session)으로 만들어야 한다.
- psmux 경로는 Claude Code 내부 구현(TmuxBackend 명령 집합, isTTY 게이트, 래퍼 주입)에 기대고 있어서 Claude Code 업데이트로 깨질 수 있다. 기본 경로가 아니라 "파워 모드" 선택지로 두고, 버전 조합을 고정해 검증하는 편이 안전하다.
- 네이티브 Windows에서 공식 지원되는 팀 표시 방식은 사실상 in-process뿐이다. 하네스가 "팀원별 창"을 원하면 Claude 팀 기능 대신 독립 세션 여러 개와 cross-session messaging(7절)으로 구성하는 편이 공식 지원 범위에 들어간다.

### Gaps
- 2026-10 기준 psmux에서 "팀원 하나당 pane 하나"가 정상 동작하는지 확인하지 못했다(4월 댓글 이후 정보 없음).
- `claude -w <name> --tmux`가 psmux 위 Windows에서 동작하는지 확인하지 못했다.
- Anthropic의 WT/WezTerm/Zellij 백엔드 계획은 공개 정보가 없다.

## 3. Windows에서 쓸 수 있는 스크립터블 멀티플렉서/터미널 비교 (WezTerm, Zellij, tmux@WSL2, psmux, Wave, Tabby, Warp)

### Takeaway
프로그램으로 pane을 다루는 능력(생성 + ID 반환 + 목록 + 입력 전송)은 WezTerm, Zellij(0.44+), psmux/tmux가 갖췄다. WT, Warp, Tabby에는 없다. 다만 WezTerm은 마지막 stable이 2024-02이고 2026년에는 nightly만 나와 유지보수 위험이 있다. Zellij는 2026-03-23(0.44.0)에야 네이티브 Windows를 지원해서 Windows 포트가 젊다. psmux는 Claude agent teams와 제일 잘 맞고 활발하지만(v3.4.0, 2026-10-13 추정) 신생 서드파티다. tmux@WSL2는 성숙했지만 에이전트가 Linux 쪽에서 돈다는 비용이 있다.

### Cited Findings
**WezTerm**
- `wezterm cli` 서브커맨드: `activate-pane-direction, activate-pane, activate-tab, adjust-pane-size, get-pane-direction, get-text, kill-pane, list-clients, list, move-pane-to-new-tab, rename-workspace, send-text, set-tab-title, set-window-title, spawn, split-pane, zoom-pane`. 실행 중인 인스턴스는 `--prefer-mux`(wezterm.lua의 첫 unix domain), `WEZTERM_UNIX_SOCKET`, GUI 탐색(`--class`) 순으로 찾는다. 대상 pane은 `--pane-id`, `WEZTERM_PANE` env, 가장 최근 상호작용한 클라이언트의 포커스 pane 순이다. — [WezTerm: wezterm cli](https://wezterm.org/cli/cli/index.html)
- `split-pane` ✅: `--pane-id`, `--horizontal`(=`--right`), `--left/--right/--top/--bottom`(방향을 안 주면 bottom), `--top-level`, `--cells`, `--percent`, `--cwd`, `--move-pane-id`, `[PROG]...`. 성공하면 새 pane-id를 출력한다. — [split-pane](https://wezterm.org/cli/cli/split-pane.html)
- `spawn` ✅: `--pane-id`, `--domain-name`, `--window-id`, `--new-window`, `--cwd`, `--workspace`(`--new-window`가 필요), `[PROG]...`. 새 pane-id를 출력한다. — [spawn](https://wezterm.org/cli/cli/spawn.html)
- `send-text` ✅: `--pane-id`, `--no-paste`(bracketed paste 대신 직접 전송), TEXT가 없으면 stdin에서 읽는다. — [send-text](https://wezterm.org/cli/cli/send-text.html)
- `list` ✅: `--format table|json`. JSON 필드는 `window_id, tab_id, pane_id, workspace, size{rows,cols}, title, cwd`(예시 기준). — [list](https://wezterm.org/cli/cli/list.html)
- "Unix domains are supported on all systems, even Windows." 단 WSL 연동은 "only works with WSL 1"이다(WSL2는 AF_UNIX interop을 지원하지 않음). — [WezTerm: Multiplexing](https://wezterm.org/multiplexing.html)
- 알림: `window:toast_notification(title, message, [url, [timeout_milliseconds]])`가 있으며 Windows에서는 고정 시간만 표시된다. `notification_handling` 값은 `AlwaysShow|NeverShow|SuppressFromFocusedPane|SuppressFromFocusedTab|SuppressFromFocusedWindow`이고, OSC 777(`\e]777;notify;title;body\e\\`)과 OSC 9(`\e]9;msg\e\\`)를 알림으로 바꾼다(20240127 이후). — [toast_notification](https://wezterm.org/config/lua/window/toast_notification.html), [notification_handling](https://wezterm.org/config/lua/config/notification_handling.html)
- 릴리스 상태: 최신 stable은 `20240203-110809-5046fc22`(2024-02)이고, 2026-03-31 nightly(`20260331-040028-577474d8`)가 winget 요청에 등장한다. 2026년 새 stable 발표는 찾지 못했다. — [wezterm#7825](https://github.com/wezterm/wezterm/issues/7825), [winget-pkgs#366970](https://github.com/microsoft/winget-pkgs/issues/366970)

**Zellij**
- 0.44.0(2026-03-23): "Zellij now runs natively on Windows(!!)."(커뮤니티 기여 divens). Windows 사용자도 Linux/macOS와 같은 세션 관리, 자동화, 플러그인, 멀티플레이어를 쓴다고 한다. CLI 자동화로 `zellij run --blocking / --block-until-exit-success / --block-until-exit-failure`, 생성 API가 새 pane/tab ID를 반환, `zellij action list-panes`, `zellij action send-keys --pane-id 1 "Ctrl c" "Enter"`, `zellij action dump-screen`, `zellij subscribe`(실시간 viewport 구독), `detach`·`switch-session`, `zellij attach https://...`(원격 attach)가 추가됐다. Windows 제약 목록은 따로 없다. — [Zellij 0.44.0 블로그](https://zellij.dev/news/remote-sessions-windows-cli/)
- 이후 릴리스: 0.44.1(04-07) "Various fixes for the recent Windows port", `focus-pane-with-id` action, pane 생성 CLI에 `--tab-id`. 0.45.0(08-20) `new-pane`에 `--pane-id`(`--in-place`와 함께)·`--no-focus`, `run`에 `--no-focus`. 0.45.1(2026-08-28) 세션을 특정 명령으로 시작하는 `-c`/`-b`. `list-panes`는 JSON 출력을 선택할 수 있다. 0.44.0에서 protobuf 기반 클라이언트-서버 계약이 생겨 옛 세션에서는 새 기능이 "silently fail"한다. — [zellij releases](https://github.com/zellij-org/zellij/releases)
- winget에 0.44.x MSI/zip(`x86_64-pc-windows-msvc`)이 있다. — [wingetgui: Zellij](https://wingetgui.com/apps/Zellij-Zellij). 그 전에는 비공식 Windows 포트(0.43.1-win32.5, ConPTY, named-pipe IPC)가 있었다. — [wingetly: arndawg/zellij-windows](https://wingetly.io/apps/arndawg/zellij-windows)

**psmux**
- "The native Windows tmux. Born in PowerShell, made in Rust." ConPTY를 직접 쓰고 WSL/Cygwin/MSYS2가 필요 없다. `tmux`/`pmux` 별칭을 깔고, "90+ tmux-compatible commands", "140+ format variables", `.tmux.conf` 읽기, warm pool, 세션 지속을 내세운다. 설치는 `winget install psmux`, scoop, `cargo install psmux`, `choco install psmux`. Windows 10/11, PowerShell 7+ 권장. GitHub 3.7k stars, 233 forks. — [GitHub psmux](https://github.com/marlocarlo/psmux)
- 릴리스: v3.4.0(13 Oct, changelog 날짜로 2026 추정)은 Claude Code류 TUI 깜빡임을 줄이는 synchronized output(DECSET 2026), CJK/버스트 붙여넣기 수정, "a hidden pane cursor that keeps IME composition at the caret", 서버 정리 강화를 담았다. v3.3.8(18 Aug)은 wide glyph 관련 크래시와 `PSMUX_DATA_DIR`, v3.3.7(20 Jul)은 `respawn-pane`이 `--`를 존중하게 해 agent-teams 팀원이 뜨게 한 수정이다. — [psmux releases](https://github.com/psmux/psmux/releases)

**tmux @ WSL2**
- WSL에서는 wt.exe alias가 동작하지 않아 `cmd.exe /c "wt.exe"`가 필요하다. — [MS Learn wt CLI](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
- WSL2 세션과 네이티브 Windows 세션은 같은 PC에서도 Claude cross-session messaging으로 서로 닿지 않는다. — [Claude Code Docs: cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- tmux 안에서는 Claude Code의 데스크톱 알림과 진행률 표시가 바깥 터미널로 나가지 않으므로 `set -g allow-passthrough on` 등이 필요하다. — [Claude Code Docs: terminal config](https://code.claude.com/docs/en/terminal-config)
- Windows 11 + WSL2에서 한국어 IME 조합 글자가 입력줄 아래에 나타나는 보고가 있다(2026-03, closed). — [claudeissues 미러 #38517](https://claudeissues.com/issue/38517-korean-ime-hangul-input-broken-in-wsl2-terminal-pre-edit-text-appears-below-inpu)

**Wave Terminal (`wsh`)** — ✅ [wsh-reference.mdx (GitHub 소스)](https://raw.githubusercontent.com/wavetermdev/waveterm/main/docs/docs/wsh-reference.mdx)
- `wsh run -- <command>` 또는 `-c "<cmd>"`. 플래그: `-m/--magnified`, `--cwd`, `-x/--exit`(성공 시 블록 닫기), `-X/--forceexit`, `--delay`(기본 2000), `-p/--paused`, `-a/--append`.
- `wsh blocks list [--json] [--workspace|--window|--tab|--view]`, `wsh deleteblock -b <id>`, `wsh getmeta/setmeta -b <id>`, `wsh notify [msg] -t <title> [-s]`, `wsh badge [icon] --color --priority --beep --pid -b`.
- 블록 참조 방식: `this`, `tab`, UUID, 8자리 ID, 100 미만 번호. 문서에 Windows 관련 주석으로 "`--pid` flag is not supported on Windows"(badge)와 `wsh secret set`이 Windows Credential Manager를 쓴다는 내용이 있다. "focus" 명령은 없다.

**Warp / Tabby**
- Warp: `warp://action/new_tab?path=...`, `warp://action/new_window?path=...`, `warp://launch/<path>` URI가 있고, Launch Configurations(legacy)는 Tab Configs로 대체됐다. pane 목록·입력 전송 API는 문서에서 찾지 못했다. — [Warp URI scheme](https://docs.warp.dev/terminal/more-features/uri-scheme/), [Warp Tab Configs](https://docs.warp.dev/terminal/windows/tab-configs/)
- Tabby: 크로스플랫폼 터미널이고 `open`, `run`, `profile` 서브커맨드가 있는 CLI가 있다는 약한 출처만 있으며 플래그는 확인하지 못했다. — [Eugeny/tabby](https://github.com/Eugeny/tabby), [Algolia docsearch index](https://docsearch.algolia.com/mcp/docs/repo/eugeny/tabby)

### Inferences
| 후보 | 생성 + ID 반환 | 목록/활성 pane | 특정 pane 입력 전송 | detach/attach·지속 | Windows 성숙도(2026-10) | Claude teams split |
|---|---|---|---|---|---|---|
| Windows Terminal | 생성만(ID 없음) | 없음 | 없음 | 창 복원(1.25), workspaces(1.26 preview) | 기본 탑재, 가장 성숙 | 미지원(공식) |
| psmux | tmux식(`split-window -P -F` 등 [미검증]) | tmux식 [미검증] | `send-keys` ✅(Claude 백엔드가 사용) | tmux식 세션 지속 | 신생, 매우 활발 | 사실상 동작(우회) |
| Zellij ≥0.44 | ✅(ID 반환) | `list-panes` ✅ | `send-keys --pane-id` ✅ | 세션/attach ✅ | Windows 포트 7개월차 | 미지원(요청 #24122) |
| WezTerm | ✅(pane-id 출력) | `list --format json` ✅ | `send-text --pane-id` ✅ | unix domain mux(Windows OK) | 기능 성숙, stable 정체(2024-02) | 미지원(요청 #23574) |
| tmux@WSL2 | ✅ | ✅ | ✅ | ✅ | 성숙, 단 Linux 쪽 에이전트 | 공식 지원 |
| Wave | `wsh run` | `blocks list --json` ✅ | 문서에서 못 찾음 | 앱 자체 상태 | Electron 앱, 전용 생태계 | 미지원 |
| Warp/Tabby | URI/CLI로 열기만 | 없음 | 없음 | - | - | 미지원 |

- 기본 터미널(WT)을 그대로 두고 그 안에서 프로그램으로 pane을 다루고 싶다면, WT 안에서 psmux나 Zellij를 실행하는 "WT + 멀티플렉서" 조합이 현실적이다. 바깥 창의 foreground 처리와 알림은 여전히 WT의 몫이다.
- tmux@WSL2는 Windows 쪽 Claude/Codex 세션 저장소, cross-session messaging, PowerShell 도구와 갈라진다. Windows-first 하네스의 기본 경로로는 맞지 않다.

### Gaps
- Zellij Windows 포트의 알려진 제약(IPC 방식, PowerShell 통합, 한국어 IME)은 공식 문서에서 찾지 못했다.
- WezTerm의 Windows 한국어 IME 품질은 출처를 찾지 못했다.
- psmux에서 `list-panes`, `capture-pane`, `display-message -p`, `-P -F`가 실제로 지원되는지는 `psmux list-commands`나 compatibility 문서로 확인해야 한다.
- Wave Terminal의 Windows 공식 지원 범위와 안정성, Tabby CLI 플래그는 확인하지 못했다.
- tmux@WSL2에서 Windows 네이티브 .exe(claude.exe, codex.exe)를 띄울 때의 함정(경로 변환, Ctrl+C, 성능)은 1차 출처를 찾지 못했다.

## 4. 직접 앱을 만들 경우: ConPTY, node-pty, portable-pty, xterm.js, Windows 고유 문제(리사이즈, 한국어 IME, ANSI, Ctrl+C)

### Takeaway
자체 멀티 터미널 앱(Electron + node-pty + xterm.js, 또는 Tauri + portable-pty + xterm.js)은 VS Code와 Hyper가 증명한 경로라 기술적으로 가능하다. 하지만 비용이 크다. 한국어 사용자에게 가장 아픈 IME 조합 버그는 주로 TUI 쪽(Ink 기반 Claude Code)에 있어서, 앱을 새로 만들어도 고쳐지지 않는다. 그래서 ① 에이전트 상태 신호(OSC 9;4, OSC 7501 등) 파싱, ② 에이전트 전용 UI, ③ 패키지 앱만 쓸 수 있는 OS 통합(작업 표시줄 앱 태스크)이 꼭 필요해질 때까지 미루는 편이 맞다.

### Cited Findings
- ConPTY `CreatePseudoConsole(size, hInput, hOutput, dwFlags, phPC)`: 입출력 핸들은 "currently restricted to synchronous I/O"이고 스트림은 UTF-8 텍스트에 VT 시퀀스가 섞인 형태다. `PSEUDOCONSOLE_INHERIT_CURSOR`(1)를 쓰면 커서 상태 요청에 백그라운드 스레드에서 비동기로 응답해야 하며, 그러지 않으면 "may cause the calling application to hang"이다. `ResizePseudoConsole`과 `ClosePseudoConsole`이 있고, 최소 Windows 10 1809다. — [MS Learn: CreatePseudoConsole (2026 이전 문서)](https://learn.microsoft.com/en-us/windows/console/createpseudoconsole)
- node-pty: "Support for the `winpty` library has been removed. Windows 10 version 1809 (build 18309) or later is now required." ConPTY 1.25.260303002를 `third_party/conpty`에 번들한다. "node-pty is not thread safe"이고 Node 16 또는 Electron 19 이상이 필요하다. 사용처는 VS Code, Hyper, Theia 등이다. 보안 측면에서 자식 프로세스는 부모와 같은 권한으로 실행된다. — [GitHub microsoft/node-pty](https://github.com/microsoft/node-pty)
- Tauri 터미널 사례는 "Tauri 셸 + Rust 백엔드, xterm.js 렌더링, portable-pty로 PTY 생성" 구조다. — [marc2332/tauri-terminal 해설](https://prompts.brightcoding.dev/blog/marc2332tauri-terminal-build-a-terminal-emulator-in-tauri). portable-pty 포크 xpty는 Unix(openpty)와 Windows(ConPTY)를 지원한다. — [docs.rs xpty](https://docs.rs/crate/xpty/0.3.1). xterm.js는 Windows PTY 백엔드 정보(`conpty`/`winpty`)를 받는 `IWindowsPty` 인터페이스를 노출한다. — [xterm.js IWindowsPty](https://xtermjs.org/docs/api/terminal/interfaces/iwindowspty). .NET Porta.Pty는 OS 내장 ConPTY 대신 별도 배포(conpty.dll + OpenConsole.exe)를 우선한다. — [NuGet Porta.Pty](https://feed.nuget.org/packages/Porta.Pty/2.2.1)
- WT 1.25/1.26의 ConPTY 변경: 응답 없는 커서 위치 요청을 재시도하지 않고, DA1 응답을 기다리지 않는다. — [Release v1.25.2733.0](https://github.com/microsoft/terminal/releases/tag/v1.25.2733.0)
- **한국어 IME (Claude Code 쪽)**:
  - #16322 "[CRITICAL] Korean IME: Composing characters display at wrong position": Windows에서 조합 중인 음절이 다음 줄 맨 앞에 보이고, 확정되면 제자리로 간다. 메인테이너가 2026-02-06 completed로 닫았다가 "IME support had to be reverted"라며 다시 열었고, 2026-02-10 중복으로 닫혔다. 라벨은 area:tui, platform:windows. — [GitHub #16322](https://github.com/anthropics/claude-code/issues/16322)
  - 검색 요약(원문 미확인): #22853은 원인을 "React Ink가 조합 완료 전에 키 입력을 처리하는 것"으로 보고 ink PR #865와 서드파티 `terminal-ime-proxy`를 언급한다. — [GitHub #22853](https://github.com/anthropics/claude-code/issues/22853)
  - 2026년 미러 보고들: Windows 10 시작 직후 약 10초 입력 지연(우회책은 WSL) — [#47034](https://claudeissues.com/issue/47034-korean-ime-input-lag-on-windows-10-at-claude-code-startup-ink-tui-raw-mode-confl). Alt-Tab 후 IME 상태 불일치 — [#43004](https://claudeissues.com/issue/43004-windows-ime-korean-japanese-input-broken-after-alt-tabbing-back). PowerShell에서 한국어 입력 차단(v2.1.179 회귀, 2026-06, open으로 표시) — [#68952](https://claudeissues.com/issue/68952-bug-korean-ime-input-is-forcibly-blocked-in-claude-code-cli). WT에서 Shift+Enter가 마지막 조합 글자를 다음 줄로 넘김 — [#47329](https://claudeissues.com/issue/47329-bug-windows-terminal-korean-ime-shift-enter-carries-last-composing-character-to). Enter 시 마지막 글자가 다음 줄로 넘어감(Space를 먼저 누르는 우회) — [#53890](https://claudeissues.com/issue/53890-bug-korean-ime-trailing-character-dropped-to-next-line-when-pressing-enter). v2.1.220 Windows에서 음절마다 커서가 전진하지 않음(Electron 기반 터미널 "Orca"에서 재현, 같은 터미널의 다른 CLI는 정상) — [#83067](https://claudeissues.com/issue/83067-bug-korean-ime-cursor-fails-to-advance-after-each-composed-syllable-stray-line-b). 조합창이 이리저리 튐 — [#29745](https://claudeissues.com/issue/29745-korean-ime-composition-window-jumps-around-during-input). 미러라 open/closed 상태는 최신이 아닐 수 있다.
- 터미널 쪽 IME 개선: WT 1.25/1.26에서 최대화 시 후보창 위치와 조합 중 키 전송이 수정됐다. — [Release v1.25.2733.0](https://github.com/microsoft/terminal/releases/tag/v1.25.2733.0). psmux 3.4.0은 IME 조합을 caret에 유지하도록 pane 커서를 숨긴다. — [psmux releases](https://github.com/psmux/psmux/releases)
- Claude Code의 Windows 키 처리:
  - Windows에서는 `^H`로 오는 Backspace를 Ctrl+Backspace(단어 삭제)로 읽는다. 문제가 되면 `CLAUDE_CODE_BS_AS_CTRL_BACKSPACE=0`을 쓴다.
  - Shift+Enter 줄바꿈은 Windows Terminal에서 설정 없이 동작한다.
  - 깜빡임이 있으면 `/tui fullscreen` 또는 `CLAUDE_CODE_NO_FLICKER=1`을 쓴다.
  - 출처: [terminal config](https://code.claude.com/docs/en/terminal-config)
- background session에 attach한 상태의 Ctrl+C 의미: 대기 중 프롬프트에서 Ctrl+C 두 번이면 detach하고, Ctrl+Z도 detach하며, Esc는 self-paced `/loop`를 멈춘다(v2.1.295). Windows에서 attach 직후 0.5초 안에 `←`를 누르면 `Ambiguous ←, press again to detach`가 뜬다. v2.1.248부터 win32-input-mode로 남은 탭에서도 `claude agents`가 키 입력에 반응한다. — [Claude Code Docs: agent view](https://code.claude.com/docs/en/agent-view)

### Inferences
- 한국어 IME 문제는 대부분 "TUI가 실제 커서를 어디에 두고, 조합 이벤트를 어떻게 처리하느냐"에서 생긴다. 보고자들도 같은 터미널에서 다른 CLI는 정상이라고 적는다. 그래서 터미널(호스트)을 바꾸거나 직접 만들어도 Claude Code 입력창의 조합 버그는 남는다. 호스트는 후보창 위치 추적 정도만 좌우한다.
- 자체 앱을 만든다면 Electron + node-pty가 사례가 가장 많고(VS Code), Tauri + portable-pty는 가볍지만 xterm.js IME 처리를 똑같이 떠안는다. 어느 쪽이든 ConPTY의 동기 I/O 제약 때문에 pane마다 읽기/쓰기 스레드나 이벤트 루프 분리가 필요하다(CreatePseudoConsole 비고에서 나온 추론).
- 직접 만든 호스트의 차별점은 VT 스트림을 직접 본다는 것이다. 에이전트의 OSC 9;4(진행률), OSC 777/9(알림), OSC 7501(상태)을 해석해 "대기 중" 배지, 작업 표시줄 표시, 클릭으로 포커스 같은 기능을 정확히 만들 수 있다. 이 가치가 비용을 넘어설 때 고려하면 된다.

### Gaps
- ConPTY의 리사이즈/리플로 이상 동작과 Ctrl+C(CTRL_C_EVENT) 전달 의미는 1차 출처를 확보하지 못했다.
- xterm.js 자체의 한국어(2벌식) 조합 버그 현황은 확인하지 못했다.
- Windows를 지원하는 Electron/Tauri 멀티 에이전트 앱이 각각 어떤 PTY 스택을 쓰는지 공개 자료를 거의 찾지 못했다(Orca 언급 정도).
- Claude Code fullscreen 렌더러가 한국어 IME에 미치는 영향은 출처가 없다.

## 5. 창 관리와 주의 끌기: foreground, 전역 핫키, 토스트, OSC 9/777, 작업 표시줄 깜빡임, 가상 데스크톱

### Takeaway
CLI 도구에서 안전하고 실용적인 조합은 다음과 같다. ① 에이전트 자체의 훅(Claude `Notification`, Codex `notify`) → ② 토스트(작은 헬퍼로 띄움. BurntToast는 아카이브됨)와 BEL(WT `bellStyle`로 작업 표시줄 깜빡임, 1.26부터 `notification`) → ③ OSC 9;4 진행률(탭 링과 작업 표시줄) → ④ "앞으로 가져오기"는 사용자가 시작하게(WT `globalSummon` 핫키, 토스트 클릭). 백그라운드 CLI가 `SetForegroundWindow`로 창을 끌어오는 것은 Windows가 설계상 막는다. 막히면 작업 표시줄이 깜빡일 뿐이다.

### Cited Findings
- `SetForegroundWindow` 조건: 호출자가 데스크톱 앱이고, foreground 프로세스가 `LockSetForegroundWindow`로 잠그지 않았고, 열린 메뉴가 없어야 한다. 여기에 더해 다음 중 하나가 참이어야 한다: foreground lock timeout 만료 / 호출자가 foreground 프로세스 / 호출자가 foreground 프로세스가 시작한 프로세스 / foreground 창 없음 / 호출자가 마지막 입력 이벤트를 받음 / 디버깅 중. 조건을 만족해도 거부될 수 있다. "An application cannot force a window to the foreground while the user is working with another window. Instead, Windows flashes the taskbar button." 권한을 가진 프로세스는 `AllowSetForegroundWindow`로 다른 프로세스에 넘길 수 있지만, 사용자가 다음 입력을 하면 사라진다. — [MS Learn: SetForegroundWindow, ms.date 2025-10-06](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setforegroundwindow)
- `FlashWindowEx(PFLASHWINFO)`는 창의 활성 상태를 바꾸지 않고 깜빡이며, 포커스가 없는 창이 주의를 요할 때 쓰는 용도다. — [MS Learn: FlashWindowEx (2026 이전 문서)](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-flashwindowex)
- `RegisterHotKey`는 시스템 전역 핫키를 정의한다. 다른 핫키가 이미 같은 키를 등록했으면 보통 실패한다. Windows 키 조합은 OS 예약이고, F12는 디버거 예약이다. 다른 스레드가 만든 창에는 연결할 수 없다. — [MS Learn: RegisterHotKey, ms.date 2024-06-11](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-registerhotkey)
- WT `globalSummon`은 `RegisterHotKey` 기반이며 `name`으로 특정 창을 부르고, 가상 데스크톱/모니터 정책을 지정할 수 있다(1절). — [WT Actions](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions)
- 가상 데스크톱 공식 API `IVirtualDesktopManager`에는 `GetWindowDesktopId`, `IsWindowOnCurrentVirtualDesktop`, `MoveWindowToDesktop` 3개 메서드만 있다. 문서는 앱이 사용자 데스크톱을 자동으로 전환하지 말라고 권고한다. — [MS Learn: IVirtualDesktopManager (2026 이전 문서)](https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nn-shobjidl_core-ivirtualdesktopmanager)
- BurntToast: "BurntToast is no longer maintained."(저장소 아카이브), 최신 v1.1.0, `Install-Module -Name BurntToast`. v1.0.0에서 AppId 커스터마이징 등이 제거됐다. — [GitHub Windos/BurntToast](https://github.com/Windos/BurntToast)
- Claude Code 알림:
  - 기본으로 데스크톱 알림을 보내는 터미널은 Ghostty, Kitty, iTerm2뿐이다. 다른 터미널은 `"preferredNotifChannel": "terminal_bell"`이나 `Notification` 훅을 쓴다. — [terminal config](https://code.claude.com/docs/en/terminal-config)
  - "OSC 7501 Program Status Protocol"을 구현한 터미널에서는 세션이 일하는 중/사용자 대기/완료 상태를 터미널이 표시한다(v2.1.295+). 지원 터미널에서는 탭 제목 앞에 상태 글리프를 넣지 않고, 다른 터미널에서는 넣는다. `CLAUDE_CODE_DISABLE_TERMINAL_TITLE=1`이면 둘 다 끈다. — [terminal config](https://code.claude.com/docs/en/terminal-config)
  - `Notification` 훅 matcher 값: `permission_prompt`(승인 프롬프트가 약 6초 대기), `idle_prompt`(응답 후 약 60초 무입력), `auth_success`, `elicitation_*`, `agent_needs_input`, `agent_completed`, `quota_auto_resume_*`, `plugin_notification`. matcher는 `|`로 여러 값을 묶을 수 있다. 문서의 Windows 예시는 `powershell.exe`로 `System.Windows.Forms.MessageBox`를 띄우는 것인데, "the dialog can open behind your terminal window"라고 경고한다. WSL에서는 interop으로 `powershell.exe`를 쓸 수 있어야 한다. — [Claude Code Docs: hooks guide](https://code.claude.com/docs/en/hooks-guide)
  - `claude --name/-n`으로 정한 이름은 `/resume`과 터미널 제목에 표시된다. — [CLI reference](https://code.claude.com/docs/en/cli-reference)
- Codex 알림:
  - PR #7137 "Fix toasts on Windows under WSL 2"(2025-12-11 머지)는 WSL2에서 PowerShell 같은 Windows 실행 파일을 띄워 토스트를 낸다. 리뷰어는 OSC 9가 터미널이 OS 이벤트를 받아 창/탭을 전환하게 하는 수단인데 "it's unfortunate that Windows Terminal doesn't support this"라고 적었고, 클릭해도 아무 일도 일어나지 않는다고 했다. — [GitHub openai/codex#7137](https://github.com/openai/codex/pull/7137)
  - `[tui] notification_method = "auto"|"osc9"|"bel"`(auto는 OSC 9 지원을 감지하고 안 되면 BEL로 대체)와 `notifications`(bool 또는 `agent-turn-complete`/`approval-requested` 목록)는 커밋 미러와 블로그에서만 확인했다. 루트의 `notify = [...]` 외부 프로그램은 `agent-turn-complete`만 지원한다고 한다. — [커밋 미러 #10043](https://forge.lthn.ai/core/core-agent-ide/commit/147e7118e0612830e5df6c40c6ad0efd6f85dc67), [블로그 (2026-04-13)](https://codex.danielvaughan.com/2026/04/13/codex-cli-notification-pipeline-osc9-hooks-alerts/)
  - 충돌: 같은 블로그는 Windows Terminal이 OSC 9를 지원한다고 쓰는데, PR #7137 리뷰는 WT가 지원하지 않는다고 말한다.
- WezTerm은 OSC 9/777을 토스트로 바꾼다(3절). WT는 1.26 preview부터 OSC 777을 opt-in으로 지원한다(1절).
- OSC 7501: Mitchell Hashimoto가 제안한 상태 보고 프로토콜이다. 상태는 idle/working/blocked/done/error이고, key=value 형식에 계층형 task ID와 base64 메시지를 쓴다고 한다. 구현체로 libghostty/Ghostty, Rex, Terraform, Claude Code(Codex·Homebrew 포함 여부는 출처마다 다름)가 거론된다. 2026-10-08 전후 2차 출처뿐이다. — [zeli.app (EN)](https://zeli.app/story/49984159), [zeli.app (DE)](https://zeli.app/de/story/49984159)
- Windows 11 작업 표시줄 에이전트: 2026년 5월 업데이트부터 지원 에이전트(먼저 M365 Copilot Researcher)의 진행 상황을 작업 표시줄에서 보고 완료 알림을 받는 기능이 있으며, 기본 꺼짐이다. 서드파티는 `Windows.UI.Shell.Tasks` API로 참여할 수 있다고 보도됐다. — [Pureinfotech](https://pureinfotech.com/windows-11-ai-agent-support-taskbar-search/). 이 API(`AppTaskInfo`, `AppTaskContent`, `AppTaskState` 등)는 **패키지 앱**과 manifest의 app extension 선언이 필요하고, 2026년 5월부터 점진 배포된다고 한다(미러 도메인 출처라 MS Learn 원문 확인 필요). — [Windows.UI.Shell.Tasks (미러)](https://dotnet.territoriali.olinfo.it/en-us/uwp/api/windows.ui.shell.tasks). 2026-08-14 노트에서는 taskbar의 Ask Copilot을 일시 비활성화했다고 한다. — [ElevenForum](https://www.elevenforum.com/t/microsoft-temporarily-disabled-ask-copilot-on-taskbar-in-windows-11.48907/latest)

### Inferences
- **CLI 도구에 맞는 순서**: (a) BEL + WT `bellStyle: "taskbar"`(stable) 또는 `"notification"`(1.26 preview) → (b) 토스트 헬퍼 → (c) OSC 9;4 진행률. Claude Code는 진행률 표시 설정(`terminalProgressBarEnabled`)이 있으므로, WT에서 탭 진행 링과 작업 표시줄 표시로 나타날 가능성이 높다. 시퀀스가 OSC 9;4인지는 [미검증].
- **"앞으로 가져오기"**: 훅이나 하네스 같은 백그라운드 프로세스가 `SetForegroundWindow`를 부르는 방식은 실패하면 깜빡이기만 하므로 의존하지 않는다. 사용자 입력에서 시작하는 경로를 쓴다: (1) WT `globalSummon {name: "agents"}` 핫키, (2) 토스트 클릭 → 프로토콜/앱 활성화 → 하네스가 `wt -w <창> focus-tab -t <i>` 실행, (3) 사용자가 지금 입력 중인 터미널에서 실행한 명령(조건 "calling process received the last input event"/"started by the foreground process"에 해당할 수 있음).
- 토스트를 클릭해 활성화된 프로세스가 foreground 권한을 얻는지는 출처를 확보하지 못했다(Gaps). (2)는 실측 전까지 "best effort"로 둔다.
- BurntToast는 아카이브됐으므로 새 하네스의 필수 의존성으로 삼지 않는다. 대안은 Windows PowerShell 5.1의 WinRT `Windows.UI.Notifications.ToastNotificationManager` 직접 호출[미검증]이나, AUMID가 등록된 작은 헬퍼 exe(.NET/Rust)다.
- 장기적으로 하네스를 패키지 앱(MSIX)으로 만들면 `Windows.UI.Shell.Tasks`로 "에이전트 N개 진행 중/대기 중"을 작업 표시줄에 공식적으로 띄울 수 있다. 2026-10 현재는 롤아웃 초기이고 Copilot 쪽 변동도 있어 관찰 대상이다.
- 가상 데스크톱 API는 다른 프로세스의 창(WT) 이동이 제약되고 데스크톱 자동 전환도 비권장이다. WT `globalSummon`의 `desktop: "toCurrent"` 정책을 쓰는 편이 간단하다.

### Gaps
- 토스트 클릭(앱/프로토콜 활성화) 시 foreground 권한 부여 규칙은 1차 출처를 찾지 못했다.
- WT가 OSC 7501을 구현했거나 구현할 계획이 있는지 찾지 못했다(Claude 문서는 지원 터미널을 나열하지 않음).
- Codex `tui.notifications`·`notify`의 공식 문서 페이지를 찾지 못했다(커밋 미러와 블로그만 있음).
- Claude `Notification` 훅 stdin JSON 필드(session_id, cwd, message, notification_type 등)의 정확한 스키마는 hooks reference에서 확인하지 못했다. [미검증]
- PowerShell 7에서 WinRT 토스트를 직접 호출할 수 있는지 확인하지 못했다.

## 6. 2026년 Claude Code와 Codex CLI의 네이티브 Windows vs WSL: 지원 상태, 샌드박스, 셸/경로, 하네스에의 함의

### Takeaway
둘 다 2026년에 네이티브 Windows를 정식 지원한다. Claude Code는 네이티브(Windows 10 1809+)에서 **샌드박스가 미지원**이고 WSL2에서만 샌드박스가 된다. Git for Windows는 선택 사항이며, 없으면 PowerShell 도구를 쓴다. Codex는 네이티브 Windows 샌드박스(MXC 권장, elevated/unelevated 레거시)를 갖췄고 WSL은 선택이다. 하네스는 에이전트를 **네이티브**로 돌려야 세션 저장소, background supervisor, cross-session messaging(named pipe)을 하나로 공유할 수 있다. 네이티브와 WSL2 세션은 서로 메시지를 주고받지 못한다.

### Cited Findings
- Claude Code 시스템 요구사항은 Windows 10 1809+ 또는 Server 2019+이고, 셸은 Bash, Zsh, PowerShell, CMD를 지원한다. 설치: PowerShell `irm https://claude.ai/install.ps1 | iex`(자동 업데이트), CMD용 install.cmd, `winget install Anthropic.ClaudeCode`(자동 업데이트 없음; `CLAUDE_CODE_PACKAGE_MANAGER_AUTO_UPDATE=1`로 켤 수 있고 실행 중에는 exe 잠금으로 실패할 수 있음). — [Claude Code Docs: setup](https://code.claude.com/docs/en/setup)
- Windows 옵션 표: Native Windows는 Sandboxing "Not supported", WSL 2는 "Supported", WSL 1은 "Not supported"다. Git for Windows가 없으면 PowerShell tool로 셸 명령을 돌리고, 있으면 Git Bash를 Bash tool로 쓴다(`CLAUDE_CODE_GIT_BASH_PATH`). Git이 있어도 PowerShell tool이 함께 켜진다(claude.ai/Console 계정 기본). WSL에서는 WSL 안에 따로 설치해서 실행한다. — [setup](https://code.claude.com/docs/en/setup)
- 네이티브 Windows의 cross-session messaging은 v2.1.234 이상에서 per-session named pipe로 동작하고, 연결 첫 줄에 auth 토큰이 필수다. 원문: "A session inside WSL 2 and a native Windows session on the same computer can't reach each other either." — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- Claude 데스크톱 앱은 Windows x64/ARM64를 지원하고, WSL 2 배포판 안에서 도는 세션 모드도 있다. WSL 세션에서는 플러그인을 쓸 수 없고 파일 패널이 읽기 전용이다. "On Windows, Desktop doesn't read PowerShell profiles"이므로 PATH는 사용자/시스템 환경 변수로 설정해야 한다. — [Claude Code Docs: desktop](https://code.claude.com/docs/en/desktop)
- Codex on Windows: 앱, CLI, IDE 확장이 네이티브 PowerShell + Windows 샌드박스로 동작해 WSL/VM이 필요 없다.
  - 샌드박스 구현: `mxc`(권장; 관리자 설정, 추가 계정, 방화벽 규칙 불필요; Windows 11 24H2 26100.9278 또는 25H2 26200.9278 이상의 기능 필요; 포그라운드 명령이 끝나면 자식 프로세스도 종료되므로 detach된 dev 서버는 동작하지 않을 수 있음), `elevated`(레거시 우선; 전용 저권한 sandbox 사용자, 방화벽, 로컬 정책; 관리자 승인 필요), `unelevated`(레거시; restricted token과 ACL; 네트워크 격리가 약함). 레거시 모드는 UI 격리를 위해 private desktop을 쓴다.
  - 설정: `[features] prefer_mxc = true`, `[windows] sandbox = "elevated"|"unelevated"`.
  - 지원 OS: Windows 11 권장, Windows 10 1809+는 best effort(ConPTY 때문). Linux 도구가 필요하거나 작업이 이미 WSL2에 있으면 WSL을 쓰라고 한다.
  - 출처: [Codex: Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox)
- Codex CLI 세션 명령(✅ [Codex developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)):
  - 재개/분기: `codex resume [SESSION_ID]`(UUID 또는 세션 이름), `codex resume --last [--all]`, `codex fork [--last|<SESSION_ID>]`, `codex exec resume`.
  - 작업 경로·권한: `--cd, -C <path>`, `--add-dir <path>`, `--sandbox, -s read-only|workspace-write|danger-full-access`, `--ask-for-approval, -a on-request|never`.
  - 원격·다중 세션 관련: `codex app-server --listen <URL>`(실험), `codex --remote <URL>`, `codex agents`("agent command center on a shared server"), `codex queue --thread <SESSION_ID> --message "..."`.
  - Windows 메모: `codex app`은 Windows에서 workspace를 직접 열지 않고 열 경로를 출력한다.

### Inferences
- **하네스 기본은 네이티브 Windows다.** 이유는 ① 사용자가 이미 PowerShell에서 Claude Code와 Codex를 쓰고 있고, ② Claude의 background session, cross-session messaging(named pipe), 세션 저장소(`%USERPROFILE%\.claude`)가 네이티브 한쪽에 모여야 "팝아웃"과 "에이전트 간 메시지"가 같은 세계에서 동작하며, ③ WT/IME/토스트 같은 Windows 통합이 직접 닿기 때문이다.
- Claude Code는 네이티브에서 샌드박스가 없다. 여러 에이전트를 자율 모드로 돌리는 하네스라면 권한 설정을 보수적으로 두거나(permission mode, allow 규칙), 위험한 작업만 WSL2 세션이나 Codex 샌드박스 쪽으로 보내는 설계가 필요하다.
- 사용자 OS 빌드는 10.0.26300이다. Codex MXC 요구 빌드(26100.9278/26200.9278)와 브랜치가 달라 MXC 사용 가능 여부는 `codex ... sandbox` 프로브 명령으로 실측해야 한다.
- Git Bash 환경에서 하네스가 wt.exe를 부르면 MSYS 경로 변환(`/c`, `C:/` 등)과 `;` 이스케이프 문제가 생길 수 있다. 하네스 스크립트는 PowerShell 기준으로 작성하는 편이 안전하다. [미검증: MSYS 변환 세부]

### Gaps
- Codex CLI의 공식 Windows 설치 명령(npm/winget)과 Windows Terminal 관련 주의사항은 이번에 가져온 페이지에 없었다.
- Codex 세션을 두 프로세스가 동시에 resume했을 때의 동작(Claude는 transcript가 섞인다고 명시함)을 확인하지 못했다.
- 네이티브와 WSL 간 성능 차이(파일 I/O)의 2026년 정량 자료는 찾지 못했다.

## 7. 기존 에이전트 도구는 Windows를 어떻게 다루나 (Claude Code 내장 세션 기능 포함)

### Takeaway
"컨텍스트를 유지한 채 다른 터미널에서 이어 붙기"의 핵심 프리미티브는 이미 Claude Code 안에 있다. **background session**(`claude --bg`, `/bg`, `←`)과 **`claude attach <id|name>`**, `claude agents --json`, 필요 입력/완료 알림, worktree 격리, named pipe 기반 **cross-session messaging**이 Windows에서도 동작한다(Windows 전용 수정 이력이 있음). GUI 쪽은 Claude Code Desktop(Windows; 분할 보기, 새 창, OS 알림)과 Codex 앱(Windows, 2026-03 출시 보도)이 병렬 세션을 지원한다. macOS의 cmux는 여전히 macOS 전용이다. 하네스는 이 프리미티브들을 엮는 얇은 층이면 된다.

### Cited Findings
- **Background sessions / agent view** (research preview, ✅ [agent view](https://code.claude.com/docs/en/agent-view)):
  - 정의: "Each background session is a full Claude Code conversation that keeps running without a terminal attached."
  - 시작: `claude --bg "<prompt>"`(또는 `--background`; `-p`와 함께 쓸 수 없음), 세션 안에서 `/bg` 또는 빈 프롬프트에서 `←`, `claude --bg --exec '<cmd>'`.
  - attach/detach: `claude attach <id|name>`(이름 조회는 v2.1.290+, 이름으로는 실행 중일 때만). detach는 빈 프롬프트에서 `←`, `/exit`, `Ctrl+Z`, 빈 프롬프트에서 Ctrl+C 또는 Ctrl+D 두 번이며 "Detaching never stops a background session."
  - 관리: `claude agents`, `claude agents --json [--all] [--cwd <path>]`, `claude logs <id|name>`, `claude stop <id>`, `claude respawn <id>|--all`, `claude rm <id>`, `claude daemon status|logs|stop --any [--keep-workers]`.
  - 수명: supervisor가 자동 시작되고, 터미널을 닫아도 세션은 계속 돈다. 약 1시간 동안 붙어 있지 않은 유휴 세션은 프로세스를 멈추고, attach하면 재개한다(`Ctrl+T`로 고정 가능). 슬립 중에는 보존되고, 재부팅하면 멈췄다가 attach하면 저장된 대화에서 재개한다.
  - worktree: git 저장소에서는 편집 전에 `.claude/worktrees/` 아래 worktree로 옮긴다(`"worktree": {"bgIsolation": "none"}`으로 끔).
  - 알림: agent view가 열려 있으면 입력 필요/완료/실패 시 `preferredNotifChannel`로 알리고, `Notification` 훅을 `agent_needs_input`/`agent_completed`로 실행한다(v2.1.198). 탭 제목에 "2 awaiting input · claude agents"처럼 표시한다.
  - Windows 관련 이력: Windows의 stale `daemon.lock` 자동 교체(v2.1.257), win32-input-mode 키 디코드(v2.1.248), 문제 해결에 `taskkill /PID <pid>` 안내, 백그라운드 셸 작업 hand-off가 "including on Windows"(v2.1.196), Windows에서 in-flight 작업 이관(v2.1.195).
  - 다른 터미널에서 이미 resume 중인 대화의 행을 열면 `Can't open — this session is running in another terminal`로 거부한다(v2.1.248). "Attached sessions always render fullscreen."
- **세션 재개 규칙** (✅ [sessions](https://code.claude.com/docs/en/sessions)):
  - 아직 실행 중인 background session을 `claude --resume <session>`으로 열면 그 자리에서 `claude attach`를 실행한다(v2.1.285+). 설정 플래그나 파이프가 있으면 거부하고 attach 명령을 안내한다.
  - 원문: "If you resume the same session in two terminals without forking, messages from both interleave into one transcript."
  - `--fork-session`이나 `/branch`로 사본을 만든다. 저장 위치는 `~/.claude/projects/<project>/<session-id>.jsonl`이고, `claude --resume <session-id>`는 어느 디렉터리에서든 찾는다.
- **Cross-session messaging**: `ListAgents`/`SendMessage` 도구, `@이름` 멘션(v2.1.232+), `/list-agents`(`/peers`), `notify_when_idle`(v2.1.236+, 12시간 만료), `crossSessionInbound: accept|hold|refuse`. 스크립트/훅은 `CLAUDE_CODE_MESSAGING_SOCKET`으로 자기 세션에 글을 넣을 수 있고, 네이티브 Windows에서는 첫 줄 `{"type":"auth","token":"<CLAUDE_CODE_MESSAGING_TOKEN>"}`가 필수다. 30초 안에 한 줄을 보내지 않으면 연결이 닫힌다. — [cross-session messaging](https://code.claude.com/docs/en/cross-session-messaging)
- **Claude Code Desktop (Windows)**: 사이드바 병렬 세션(`Ctrl+N`, `Ctrl+Tab`), 분할 보기(`Alt`+클릭 또는 Open in > Split view), 새 창(`Ctrl`+클릭), 분할 해제 `Ctrl+Alt+W`, Worktree 토글(`<project-root>/.claude/worktrees/`), 통합 터미널(`` Ctrl+` ``), "sends an OS notification when a Code session finishes a task and you aren't currently viewing that session." CLI와 같은 settings 파일을 읽는다. Desktop의 cross-session 도구는 터미널 CLI 세션을 보지 못한다고 적혀 있다. — [desktop](https://code.claude.com/docs/en/desktop). 반면 cross-session messaging 문서는 Desktop 세션도 터미널 세션에 메시지를 보낼 수 있는 것처럼 읽힌다(문서 간 표현 불일치).
- **Codex 앱**: 2026-03-04 Windows 지원을 시작했고 병렬 에이전트와 Git worktree를 내장했다는 보도가 있다(2차 출처). — [TechRepublic](https://www.techrepublic.com/article/news-openai-codex-windows-app-launch/), [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/24114/desktop-app-parallel-ai-coding-agents)
- **cmux**: libghostty 기반 macOS 네이티브 터미널이다. 대기 중인 에이전트를 링으로 알리고, 세로 탭과 CLI/socket API가 있다. Nix 패키지는 Darwin 빌드만 있고 Windows 릴리스는 찾지 못했다. — [bitdoze](https://www.bitdoze.com/cmux-terminal/), [MyNixOS](https://mynixos.com/nixpkgs/package/cmux), [jimmysong landscape](https://landscape.jimmysong.io/projects/cmux/)
- 2차 출처 기준으로 Nimbalyst가 deprecated된 Crystal을 대체했다(2026-02). Conductor, Superset, OpenCode desktop도 거론된다. Windows 지원 여부는 확인하지 못했다. — [pasqualepillitteri.it](https://pasqualepillitteri.it/en/news/24114/desktop-app-parallel-ai-coding-agents)

### Inferences
- 사용자가 원하는 흐름("PM/리서치/합성 에이전트를 병렬로 돌리다 하나를 내 탭으로 꺼내 직접 대화")은 Claude Code만으로 거의 된다. 에이전트를 background session으로 띄우고(`claude --bg -n research-a ...`) 꺼낼 때 새 WT 탭에서 `claude attach research-a`를 실행하면, 같은 프로세스·같은 컨텍스트에 붙는다. 다 쓰면 `←`로 다시 백그라운드로 돌려보낸다. 하네스가 할 일은 "어느 창/탭에 붙일지"와 "알림/포커스"뿐이다.
- 이미 포그라운드 터미널에서 돌고 있는 일반 세션을 다른 탭에서 `--resume`하면 transcript가 섞인다. 팝아웃 전에 원래 세션을 `/bg`(또는 `←`)로 백그라운드에 넘기는 단계를 하네스 규칙으로 강제해야 한다.
- Codex에는 Claude의 attach 같은 "실행 중 세션에 붙기" 프리미티브가 공식 문서에서 보이지 않는다(app-server/`--remote`/`codex agents`는 실험적이거나 공유 서버용). Codex 팝아웃은 "원래 TUI를 닫고 새 탭에서 `codex resume <id>`"로 처리하는 수밖에 없어 보인다.
- 에이전트 간 협업(PM → 리서치 지시, 합성 에이전트에 결과 전달)은 하네스가 IPC를 직접 만들지 말고 Claude cross-session messaging을 쓰면 된다. Codex와 Claude 사이는 파일이나 하네스 큐가 필요하다.

### Gaps
- `claude attach`로 같은 background session에 두 터미널이 동시에 붙을 수 있는지 문서에 없다.
- Desktop 앱 세션을 CLI에서 이어 가는 공식 경로("Coming from the CLI"의 반대 방향)는 확인하지 못했다.
- Claude Squad, Nimbalyst, Conductor 등의 2026-10 Windows 지원 현황은 1차 출처로 확인하지 못했다.

## 8. 구체 레시피와 Windows-first 하네스의 기반 추천

### Takeaway
**추천 기반: Windows Terminal(보기 계층) + Claude Code background session(컨텍스트·지속 계층) + 얇은 하네스 CLI(PowerShell 모듈로 시작, 레지스트리 JSON) + 훅/BEL/OSC 기반 알림.** psmux는 "Claude agent teams split pane"과 tmux식 프로그램 제어가 필요할 때만 쓰는 선택 백엔드로 둔다. 자체 터미널 앱은 미룬다. 두 번째 백엔드 후보로는 Zellij(2026년 활발, 네이티브 Windows, 강한 CLI)를 지켜보고, WezTerm은 stable 정체 위험 때문에 기본으로 삼지 않는다.

### Cited Findings
- 레시피에 쓴 플래그 출처는 다음과 같다(모두 앞 절에 인용).
  - wt.exe의 `-w`, `new-tab`, `split-pane -V --size`, `--title`, `--tabColor`, `-d`, `focus-tab -t`, PowerShell `;` 이스케이프/대기 문제: [MS Learn wt CLI](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments)
  - `globalSummon`: [WT Actions](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/actions)
  - `claude --bg`, `-n`, `attach`, `agents --json`, `--resume`: [CLI reference](https://code.claude.com/docs/en/cli-reference), [agent view](https://code.claude.com/docs/en/agent-view), [sessions](https://code.claude.com/docs/en/sessions)
  - `preferredNotifChannel`, `Notification` matcher: [terminal config](https://code.claude.com/docs/en/terminal-config), [hooks guide](https://code.claude.com/docs/en/hooks-guide)
  - `bellStyle`, `compatibility.allowOSC777`: [profile-advanced](https://learn.microsoft.com/en-us/windows/terminal/customize-settings/profile-advanced), [v1.26 release](https://github.com/microsoft/terminal/releases/tag/v1.26.2734.0)
  - `codex resume`, `--cd`: [Codex developer commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)
  - psmux: [docs/claude-code.md](https://github.com/psmux/psmux/blob/master/docs/claude-code.md)
  - WezTerm: [cli split-pane](https://wezterm.org/cli/cli/split-pane.html), [spawn](https://wezterm.org/cli/cli/spawn.html), [send-text](https://wezterm.org/cli/cli/send-text.html), [list](https://wezterm.org/cli/cli/list.html)
  - Zellij: [0.44.0 블로그](https://zellij.dev/news/remote-sessions-windows-cli/), [releases](https://github.com/zellij-org/zellij/releases)

### Inferences
**레시피 (PowerShell 기준. 실측 전 초안이며, 각 줄의 플래그는 위 출처로 확인. 조합 동작은 테스트 필요)**

R0. 에이전트를 "꺼낼 수 있는" 형태로 시작하기 (background session)
```powershell
cd C:\work\repo
claude --bg -n pm         "PM 역할: ..."        # --bg ✅, -n ✅ (세션 ID와 관리 명령을 출력하고 바로 반환)
claude --bg -n research-a "리서치 A: ..."
claude --bg -n synth      "합성: ..."
claude agents --json       # 하네스 레지스트리 동기화용 목록 ✅ (state 파일 직접 파싱은 비권장)
```
- 주의: `--bg`는 workspace trust를 먼저 확인한다. git 저장소면 편집 전에 `.claude/worktrees/`의 worktree로 옮긴다(꺼내면 cwd가 worktree). 약 1시간 유휴 후 프로세스가 멈췄다가 attach하면 재개한다(`Ctrl+T`로 고정).

R1. "실행 중인 에이전트 세션 안에서" 에이전트 X를 **현재 WT 창의 새 탭**으로 꺼내기 (컨텍스트 유지)
```powershell
Start-Process wt.exe -ArgumentList '-w 0 new-tab --title research-a --tabColor #2E86DE -d "C:\work\repo" claude attach research-a'
```
- `Start-Process`에 문자열 하나를 넘기는 이유: PowerShell이 `;`/`#`를 해석하지 않게 하고, 문서에 나온 "PowerShell이 Store 앱 종료를 기다리는" 문제를 피하기 위해서다(추론).
- 대상이 background가 아닌 포그라운드 세션이면 먼저 원래 터미널에서 `/bg` 해야 한다. 그러지 않고 `--resume`하면 transcript가 섞인다 ✅.
- `claude --resume research-a`도 실행 중인 background session이면 attach로 동작한다(v2.1.285+) ✅.
- 실행 중인 세션이 없는 과거 세션이면: `... claude --resume <session-id>` ✅. worktree 안 세션이면 `-d`를 그 worktree 경로로 준다.
- 탭 제목은 `-n` 이름과 상태 글리프를 그대로 보여 주도록 `--suppressApplicationTitle`을 쓰지 않는다.
- Claude 세션 안(Bash 도구 = Git Bash)에서 실행할 때는 `powershell.exe -NoProfile -Command "Start-Process wt.exe -ArgumentList '...'"`로 감싸 MSYS 인자 변환을 피한다. [미검증]

R2. 현재 pane을 분할해 에이전트 Y 실행
```powershell
Start-Process wt.exe -ArgumentList '-w 0 split-pane -V --size 0.4 --title synth -d "C:\work\repo" claude attach synth'
# 새 세션이면 마지막을: claude -n synth
```
- `-V`는 좌우 분할이다(#24384의 tmux `split-window -h` ↔ `wt -w 0 split-pane -V` 대응표). 분할 대상은 MRU 창의 활성 pane이다.

R3. 에이전트 그룹을 한 번에 구성 ("agents"라는 이름 있는 창)
```powershell
Start-Process wt.exe -ArgumentList '-w agents new-tab --title control -d "C:\work\repo" claude agents ; new-tab --title pm --tabColor #E67E22 -d "C:\work\repo" claude attach pm ; split-pane -V --title research-a --tabColor #2E86DE claude attach research-a'
```
- `control` 탭의 `claude agents`(agent view)가 전체 세션 상태, 입력 필요 표시, 알림을 맡는 "관제 탭" 역할을 한다 ✅.

R4. 기존 에이전트 탭 포커스 (우선순위 순)
1. 관제 탭에서 `claude agents` → 행 선택 → Enter(attach). 같은 터미널 안 전환이라 가장 확실하다 ✅.
2. 에이전트마다 이름 있는 창(`-w agent-research-a`)을 쓰고 `Start-Process wt.exe -ArgumentList '-w agent-research-a focus-tab -t 0'`. 창이 foreground로 올라오는지는 [미검증].
3. WT 설정에 `globalSummon` 핫키를 둔다(사용자 입력에서 시작하므로 foreground 제약에 걸리지 않음):
```json
// settings.json "actions" 항목 (action 형식 ✅)
{ "command": { "action": "globalSummon", "name": "agents", "toggleVisibility": false }, "id": "User.SummonAgents" }
// 키 바인딩 연결 형식(예: "keybindings": [{ "id": "User.SummonAgents", "keys": "ctrl+alt+a" }])은 설정 스키마 버전에 따라 다름 [미검증]
```

R5. 알림 파이프라인 (Claude Code + WT)
```json
// ~/.claude/settings.json
{
  "preferredNotifChannel": "terminal_bell",
  "hooks": {
    "Notification": [
      { "matcher": "permission_prompt|idle_prompt|agent_needs_input|agent_completed",
        "hooks": [ { "type": "command",
                     "command": "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\\tools\\agent-toast.ps1" } ] }
    ]
  }
}
```
```json
// Windows Terminal 프로필 (stable 1.25): BEL → 작업 표시줄 깜빡임 ✅
{ "bellStyle": "taskbar" }
// Preview 1.26: 벨 → 데스크톱 알림, OSC 777 허용 ✅ (둘 다 기본 꺼짐)
{ "bellStyle": "notification", "compatibility.allowOSC777": true }
```
- `agent-toast.ps1`은 훅 stdin JSON을 읽고(필드명 [미검증]) 토스트를 띄운다. BurntToast는 아카이브됐으므로 WinRT 직접 호출[미검증]이나 작은 헬퍼 exe를 쓴다.
- 문서 예시인 MessageBox는 터미널 뒤에 뜰 수 있다 ✅.

R6. Codex CLI 알림 (공식 문서 미확인: 커밋 미러와 블로그 기반)
```toml
# ~/.codex/config.toml
notify = ["powershell.exe", "-NoProfile", "-File", "C:\\tools\\codex-notify.ps1"]   # agent-turn-complete만 (블로그)
[tui]
notifications = ["agent-turn-complete", "approval-requested"]   # (블로그/커밋 미러)
notification_method = "bel"   # WT는 OSC 9 미지원(PR #7137 리뷰) → BEL → WT bellStyle로 깜빡임
```
- Codex 팝아웃: 원래 TUI를 종료한 뒤 `Start-Process wt.exe -ArgumentList '-w 0 new-tab --title codex-x -d "C:\work\repo" codex resume <SESSION_ID>'`(`codex resume` ✅). 동시 resume 동작은 [미검증].

R7. psmux "파워 모드" (Claude agent teams split pane + tmux식 제어)
```powershell
winget install psmux                         # ✅
# ~/.claude/settings.json 에 { "teammateMode": "tmux" } ✅ (Agent View 재실행 시 in-process로 돌아가는 문제 회피)
psmux                                        # 세션 시작(서브커맨드/플래그 [미검증])
claude                                       # psmux pane 안에서 대화형 실행 → 팀원이 pane으로 생성 ✅
tmux split-window -h -c C:\work\repo "claude attach research-a"   # tmux 문법; psmux 지원은 [미검증]
tmux send-keys -t %3 "상태 보고해줘" Enter                         # send-keys는 Claude 백엔드가 사용 ✅, 대상 지정 문법 [미검증]
tmux list-panes -a -F "#{pane_id} #{pane_title}"                  # [미검증]
```
- 관련 제약: PowerShell 7 필수, worktree 격리 에이전트는 in-process로 돈다, 빌드 22523 미만은 휠 미전달 ✅.

R8. WezTerm 대안 (pane 프로그램 제어가 꼭 필요할 때)
```powershell
$p = wezterm cli spawn --new-window --cwd C:\work\repo -- claude attach research-a   # ✅ pane-id 출력
wezterm cli split-pane --pane-id $p --right --percent 40 --cwd C:\work\repo -- claude attach synth   # ✅
wezterm cli send-text --pane-id $p --no-paste "status?`r"                          # ✅
wezterm cli list --format json                                                     # ✅
wezterm cli activate-pane --pane-id $p                                             # 서브커맨드 ✅, 플래그 [미검증]
```

R9. Zellij 대안
```powershell
zellij run -- claude attach research-a        # run은 새 pane ID 반환(0.44.0) ✅; --no-focus(0.45.0) ✅
zellij action list-panes                      # ✅ (JSON 출력 플래그명 [미검증])
zellij action send-keys --pane-id 1 "Ctrl c" "Enter"   # ✅
```

R10. 에이전트 간 메시지 (하네스 IPC 없이)
- PM 세션에서 "`@research-a`에게 범위 변경을 알려줘" 같은 프롬프트로 지시한다(v2.1.232+) ✅. 진행 대기는 `notify_when_idle` ✅.
- 하네스 훅이 자기 세션에 결과를 넣을 때는 named pipe(`CLAUDE_CODE_MESSAGING_SOCKET`)에 auth 줄을 먼저 보내고 메시지 한 줄을 보낸다 ✅.

**추천 근거와 설계 요약**
- **왜 WT인가**: Windows 11 기본 탑재라 설치가 필요 없다. 이름 있는 창(`-w name`)과 탭 색/제목으로 정리할 수 있고, 2026년 IME 수정, OSC 9;4 진행률, 벨/OSC 777 알림 경로가 있으며, `globalSummon`으로 사용자 주도의 "앞으로 가져오기"를 지원한다. 약점(조회/입력 전송 API 없음)은 Claude background session과 하네스 레지스트리로 상당 부분 메울 수 있다.
- **왜 Claude background session인가**: 컨텍스트를 들고 있는 주체가 터미널이 아니라 Claude supervisor다. 그래서 탭을 닫아도 에이전트가 살아 있고, 어느 탭에서나 `claude attach`로 붙었다 뗄 수 있다. 사실상 tmux의 attach/detach를 대신한다. 목록(JSON), 입력 필요 알림, worktree 격리도 함께 온다.
- **하네스가 직접 할 일 (P0)**: `agent new|pop|split|focus|list|notify` 명령(PowerShell 모듈), 레지스트리 JSON(에이전트 → 도구 종류(claude/codex) · 세션 ID/이름 · cwd/worktree · WT 창 이름 · 색), `/bg` 선행 강제 규칙, Codex용 resume 래퍼, 토스트 헬퍼.
- **P1**: WT JSON fragment로 에이전트 프로필 배포, globalSummon 핫키 템플릿, 토스트 클릭 → 포커스 경로 실측.
- **P2**: psmux 백엔드(agent teams pane과 send-keys가 필요한 사용자용). Zellij 백엔드는 Windows 포트가 안정되면 검토한다.
- **P3**: 패키지 앱으로 `Windows.UI.Shell.Tasks` 작업 표시줄 연동, OSC 7501을 해석하는 자체 호스트 검토(그 무렵 WT 지원 여부 재확인).
- **하지 말 것**: 백그라운드에서 `SetForegroundWindow`에 의존하기, BurntToast를 필수 의존성으로 삼기, WSL2를 기본 경로로 삼기(세션과 메시지 세계가 갈라짐), in-process 팀원을 팝아웃 대상으로 삼기, 같은 세션을 두 터미널에서 fork 없이 resume하기.

### Gaps
- 사용자 PC에서 실측해야 할 항목:
  - ① `wt -w <name> ...`이 기존 창을 foreground로 올리는지(Claude Bash/PowerShell 도구에서 실행했을 때와 사용자 셸에서 실행했을 때 각각)
  - ② `Start-Process wt.exe` 문자열 인자에 공백 경로나 `#` 색상이 섞일 때의 파싱
  - ③ WT 1.25 stable과 1.26 preview, psmux 안 각각에서 Claude Code 한국어 IME 품질
  - ④ `claude attach`로 두 터미널이 동시에 붙을 수 있는지
  - ⑤ Claude Code 진행률 표시가 WT 탭과 작업 표시줄에 뜨는지
  - ⑥ Codex `notification_method`의 실제 키 이름과 동작
- 레시피의 [미검증] 플래그(WezTerm `activate-pane --pane-id`, psmux의 tmux 명령 세부, Zellij JSON 플래그, WT 키 바인딩 스키마)는 각 도구의 `--help`로 확정해야 한다.
