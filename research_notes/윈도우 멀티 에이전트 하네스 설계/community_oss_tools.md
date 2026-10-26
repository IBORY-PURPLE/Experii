# Community / OSS tools for running and steering multiple AI coding agents in parallel (landscape as of 2026-10-25)

*Method note: star counts, creation dates, licenses, latest releases and issue reaction counts were pulled live from the GitHub REST API (authenticated `gh api`) on 2026-10-25, so they are point-in-time. HN data came from the HN Algolia API. Reddit could not be accessed at all (both the search tool and direct JSON requests are blocked for this crawler), so Reddit sentiment is a gap; HN, GitHub issues, GeekNews (Korean) and blogs stand in for it. Several "best tools 2026" comparison posts were written by vendors of tools they rank (e.g., the DEV/nimbalyst.com posts are by the Nimbalyst founder), so treat their rankings with caution. Anything dated before 2026 is labelled.*

---

## Q1. Which community/OSS tools are most used or mentioned in 2026, and how does each one work? (design, steering one agent, pop-out/attach, Windows support, pain points, opportunity)

### Takeaway
The 2026 field split into five families: (1) **agent-aware terminals/multiplexers**: cmux (macOS), Herdr (Rust, cross-platform incl. native Windows, 45.8k stars), wmux and psmux (Windows-native); (2) **worktree session managers (TUI)**: claude-squad, ccmanager, agent-deck, dmux, workmux, agent-of-empires, mostly tmux-bound and therefore WSL-only on Windows; (3) **desktop "ADE" GUIs**: vibe-kanban, Nimbalyst (ex-Crystal), Superset, emdash, Jean, Maestro, Paseo, Orchestrator.inc, xum (ex-Coder mux), opcode; (4) **team/swarm orchestrators**: ruflo (ex-claude-flow), oh-my-claudecode, Gas Town, OpenRig, Tmux-Orchestrator, Runner; (5) **remote/mobile clients**: Happy, claudecodeui, and the new herdr clients (Omnara has pivoted out of this). Almost every tool manages **separate top-level CLI sessions**. None of them lets you take a subagent spawned inside one chat and pop it out into its own terminal with its context intact. Windows-native support is still the exception (vibe-kanban, Nimbalyst, emdash, Maestro, Paseo, Orchestrator.inc, Herdr, wmux, psmux, Runner-alpha). Most tmux-based tools and the most-hyped terminal, cmux, are macOS/Linux/WSL only.

### Cited Findings

#### A. Traction snapshot (GitHub API, 2026-10-25)

| Tool (repo) | Stars | Created | Latest release / activity | License | Form factor | Windows |
|---|---|---|---|---|---|---|
| ruflo, formerly claude-flow ([ruvnet/ruflo](https://github.com/ruvnet/ruflo)) | 79,122 | 2025-06 | v3.63.0, 2026-10-25 | MIT | Claude Code plugins + MCP server + `npx ruflo tui` console | Not stated (Node/npx-based; unverified) |
| Herdr ([herdrdev/herdr](https://github.com/herdrdev/herdr)) | 45,751 | 2026-03-27 | pushed 2026-10-23 | Apache-2.0 | Rust terminal multiplexer/"agent runtime" running inside any terminal | Native (ConPTY), docs call it generally available, with partial IME/Korean input ([docs](https://herdr.dev/docs/windows-beta/)) |
| oh-my-claudecode ([Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)) | 40,241 | 2026-01-09 | v5.7.14, 2026-10-24 | MIT | Claude Code plugin; `/team` (native teams) + `omc team` tmux workers | Native via psmux, or WSL2 tmux ([README](https://github.com/Yeachan-Heo/oh-my-claudecode)) |
| vibe-kanban ([BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban)) | 28,446 | 2025-06 | v0.1.44, 2026-04-24 (company shut down) | Apache-2.0 | Rust + web UI kanban, worktree per task | Native (windows-x64 binary in npx CLI, [cli.ts](https://github.com/BloopAI/vibe-kanban/blob/main/npx-cli/src/cli.ts)) |
| cmux ([manaflow-ai/cmux](https://github.com/manaflow-ai/cmux)) | 28,393 | 2026-01-28 | v0.65.2, 2026-10-16 | GPL-3.0-or-later (server parts BSL 1.1) | Native Swift/AppKit terminal on libghostty | None ("macOS only, for now") |
| Happy ([slopus/happy](https://github.com/slopus/happy)) | 24,301 | 2025-07 | cli-1.2.6-beta.1, 2026-10-09 | MIT | CLI wrapper + E2E-encrypted mobile/web + desktop app | Desktop app lists Windows ([README](https://github.com/slopus/happy)) |
| opcode, formerly Claudia ([winfunc/opcode](https://github.com/winfunc/opcode)) | 22,421 | 2025-06 | last release v0.2.0, **2025-08-31** (stale) | AGPL-3.0 | Tauri 2 GUI for Claude Code | Windows 10/11 listed in requirements ([README](https://github.com/winfunc/opcode)) |
| Paseo ([getpaseo/paseo](https://github.com/getpaseo/paseo)) | 21,920 | 2025-10 | pushed 2026-10-25 | relicensing AGPL→Apache ([#2982](https://github.com/getpaseo/paseo/issues/2982)) | Daemon + desktop/web/mobile/CLI clients | macOS/Windows/Linux per maintainer ([HN](https://news.ycombinator.com/item?id=48380782)) |
| Gas Town ([gastownhall/gastown](https://github.com/gastownhall/gastown)) | 18,528 | 2025-12 | v1.2.1, 2026-06-06 | MIT | Go CLI + tmux roles (Mayor, polecats…) | Minimal native CLI; full tmux workflow needs WSL ([README](https://github.com/gastownhall/gastown)) |
| Superset ([superset-sh/superset](https://github.com/superset-sh/superset)) | 15,533 | 2025-10 | desktop-canary, 2026-10-25 | Elastic License 2.0 (source-available, not OSI) | Electron "agentic IDE" | "Windows: not yet available" ([README](https://github.com/superset-sh/superset)) |
| claudecodeui / CloudCLI ([siteboon/claudecodeui](https://github.com/siteboon/claudecodeui)) | 14,276 | 2025-06 | pushed 2026-10-24 | AGPL-3.0 | Web/mobile UI for Claude Code, Codex, etc. | (web) |
| Orchestrator.inc agent-orchestrator ([OrchestratorInc/agent-orchestrator](https://github.com/OrchestratorInc/agent-orchestrator)) | 13,599 | 2026-02-13 | v0.14.7-nightly, 2026-10-24 | Apache-2.0 | Desktop app + local daemon, orchestrator + workers | Windows download ([README](https://github.com/OrchestratorInc/agent-orchestrator)) |
| claude-squad ([smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad)) | 8,666 | 2025-03 | v1.0.20, 2026-08-20 | AGPL-3.0 | Go TUI on tmux + worktrees | Requires tmux, so no native Windows ([README](https://github.com/smtg-ai/claude-squad)) |
| OpenRig ([mvschwarz/openrig](https://github.com/mvschwarz/openrig)) | 8,173 | 2026-04-01 | v0.7.1, 2026-10-25 | — | Node CLI/TUI, persistent role teams on tmux/Herdr | WSL2 only ("native Windows isn't supported") |
| emdash ([generalaction/emdash](https://github.com/generalaction/emdash)) | 6,076 | 2025-08 | v1.2.9, 2026-10-23 | Apache-2.0 (YC W26) | Desktop ADE, worktree per task | Native installer (.msi/.exe) |
| 1code ([21st-dev/1code](https://github.com/21st-dev/1code)) | 5,574 | 2026-01 | **archived** (last push 2026-03-06) | Apache-2.0 | Orchestration UI | — |
| abtop ([graykode/abtop](https://github.com/graykode/abtop)) | 3,771 | 2026-03 | pushed 2026-09-14 | — | "htop for agents" monitor (author in Seoul) | Native ("no WSL required") |
| psmux ([psmux/psmux](https://github.com/psmux/psmux)) | 3,737 | 2025-11 | pushed 2026-10-25 | MIT | Native Windows tmux (Rust, ConPTY) | Native |
| Maestro ([RunMaestro/Maestro](https://github.com/RunMaestro/Maestro)) | 3,494 | 2025-11 | v1.0.2, 2026-10-21 | AGPL-3.0 | Cross-platform desktop "agent orchestration command center" | Yes (Windows shortcuts documented) |
| agent-of-empires ([agent-of-empires/agent-of-empires](https://github.com/agent-of-empires/agent-of-empires)) | 3,380 | 2026-01 | pushed 2026-10-25 | MIT | TUI + web on tmux | "Only through WSL2" |
| Omnara ([omnara-ai/omnara](https://github.com/omnara-ai/omnara)) | 3,249 | 2025-07 | pushed 2026-10-24 | Apache-2.0 | **Pivoted** to self-hostable managed-agent API platform | n/a |
| Crystal → Nimbalyst ([stravu/crystal](https://github.com/stravu/crystal) / [nimbalyst/nimbalyst](https://github.com/nimbalyst/nimbalyst)) | 3,133 / 1,972 | 2025-06 / 2025-10 | Crystal last push 2026-02-26; Nimbalyst v0.82.3, 2026-10-25 | MIT | Electron desktop workspace | Nimbalyst: native .exe (Windows 10+) |
| workmux ([raine/workmux](https://github.com/raine/workmux)) | 2,937 | 2025-11 | pushed 2026-10-23 | MIT | worktrees + tmux windows | tmux (WSL) |
| xum, formerly Coder "mux" ([coder/mux → coder/xum](https://github.com/coder/mux)) | 2,062 | 2025-09 | pushed 2026-10-25 | AGPL-3.0 | Desktop app with its own agent loop | Binaries for macOS and Linux only ([README](https://github.com/coder/mux)) |
| Tmux-Orchestrator ([Jedward23/Tmux-Orchestrator](https://github.com/Jedward23/Tmux-Orchestrator)) | 1,810 | 2025-06 | last push **2025-07-14** (pre-2026, possibly outdated) | none | tmux scripts + self-scheduling agents | tmux (WSL) |
| dmux ([standardagents/dmux](https://github.com/standardagents/dmux)) | 1,807 | 2025-08 | pushed 2026-08-16 | MIT | tmux panes + worktrees | tmux 3.0+ (WSL) |
| Jean ([coollabsio/jean](https://github.com/coollabsio/jean)) | 1,360 | 2026-01-23 | v1.0.12, 2026-10-17 | Apache-2.0 | Tauri v2 desktop + headless server | "Windows: Not fully tested" |
| ccmanager ([kbwo/ccmanager](https://github.com/kbwo/ccmanager)) | 1,273 | 2025-06 | v4.4.9, 2026-10-18 | MIT | Node TUI on node-pty (no tmux) | Officially Linux/macOS; WSL recommended ([#164](https://github.com/kbwo/ccmanager/issues/164)) |
| agent-deck ([asheshgoplani/agent-deck](https://github.com/asheshgoplani/agent-deck)) | 1,157 | 2025-12 | v1.16.33, 2026-10-24 | MIT | Go TUI on tmux | WSL ([README](https://github.com/asheshgoplani/agent-deck)) |
| Pane ([greenfield-inc/Pane](https://github.com/greenfield-inc/Pane)) | 581 | 2026-02 | pushed 2026-10-25 | — | Terminal-first desktop manager | Windows x64/ARM64 builds |
| wmux by openwong2kim ([openwong2kim/wmux](https://github.com/openwong2kim/wmux)) | 435 | 2026-03-20 | v4.10.0, 2026-10-23 | MIT | Electron + ConPTY "ADE" | Native Windows + macOS |
| wmux by amirlehmam ([amirlehmam/wmux](https://github.com/amirlehmam/wmux)) | 431 | 2026-03-25 | v2.41.0, 2026-10-25 | — | Windows reimplementation inspired by cmux | Native Windows |
| Runner ([yicheng47/runner](https://github.com/yicheng47/runner)) | 376 | 2026-04-21 | v0.18.0, 2026-10-25 (alpha) | — | Native app: crews/missions, real PTYs | macOS (Apple Silicon) + Windows x64 |
| cmux-windows ([mkurman/cmux-windows](https://github.com/mkurman/cmux-windows)) | 274 | 2026-02-27 | last push 2026-03-31 | — | WPF + ConPTY | Native (dormant) |

Other 2026 newcomers seen in GitHub search with traction: omnigent (11.0k, "meta-harness") ([repo](https://github.com/omnigent-ai/omnigent)), golutra (3.9k, Tauri, Windows/macOS/Linux) ([repo](https://github.com/golutra/golutra)), nodeterm (2.1k, canvas of tmux-backed terminals, Windows beta) ([repo](https://github.com/eneskirca/nodeterm)), multi-agent-shogun (1.4k, Japanese tmux hierarchy) ([repo](https://github.com/yohey-w/multi-agent-shogun)), amux (546, shared board) ([repo](https://github.com/mixpeek/amux)). Herdr already has its own client ecosystem: herdr-gpui native client for macOS/Linux/Windows (1.7k), ovis web/phone client (1.5k), collie mobile PWA (1.5k) (GitHub search, 2026-10-25: [herdr-gpui](https://github.com/penso/herdr-gpui), [ovis](https://github.com/devswha/ovis), [collie](https://github.com/AltanS/collie)).

Status changes to know: Crystal was replaced by Nimbalyst (repo description "(Crystal is now Nimbalyst)", [stravu/crystal](https://github.com/stravu/crystal); comparison posts date the deprecation to Feb 2026, [DEV](https://dev.to/stravukarl/best-tools-for-managing-parallel-ai-coding-agents-in-2026-14l8)). bloop, the company behind Vibe Kanban, shut down on April 10, 2026. Remote services ended about 30 days later, kanban issues/projects/orgs were removed, and the project continues as community-maintained OSS with local workspaces only ([vibekanban.com/blog/shutdown](https://vibekanban.com/blog/shutdown)). Coder renamed "Mux" to "Xum" after a trademark concern from Mux.com ([README](https://github.com/coder/mux)). Claude-flow is now "ruflo", which bills itself as an agent meta-harness for Claude Code and Codex ([README](https://github.com/ruvnet/ruflo)).

#### B. cmux deep dive (manaflow-ai/cmux)

**(1) Design/architecture**
- Native macOS app in Swift/AppKit using libghostty for GPU rendering; reads your existing Ghostty config. It is not a fork of Ghostty. The author built it because the Electron/Tauri orchestrators felt slow and GUI orchestrators "lock you into their workflow" ([README](https://github.com/manaflow-ai/cmux)).
- Core features: notification rings (blue ring on panes, lit tabs when an agent needs attention); a notification panel with "jump to latest unread" (Cmd+Shift+U); a vertical sidebar showing git branch, linked PR status, cwd, listening ports and latest notification text; horizontal/vertical splits; an in-app scriptable browser (API ported from vercel-labs/agent-browser); `cmux ssh` remote workspaces; browser cookie import; project custom commands in `cmux.json`; and a CLI plus Unix-socket API to create workspaces, split panes, send keystrokes, read screen contents, take screenshots and drive the browser ([README](https://github.com/manaflow-ai/cmux)).
- Notifications come from OSC 9/99/777 terminal sequences or from `cmux notify` wired into agent hooks. The author's motivation was that Claude Code's own notification text is always a generic "waiting for your input" with no context ([README](https://github.com/manaflow-ai/cmux)).
- Session restore covers layout, cwd, best-effort scrollback and browser history. Supported agents (Claude Code, Codex, OpenCode, Gemini, Amp, Cursor CLI, Copilot, etc.) resume via hook-saved session IDs, but live processes are **not** preserved unless you opt into `cmux local-tmux` / `cmux local-zellij` ([README](https://github.com/manaflow-ai/cmux)).
- Philosophy: "a primitive, not a solution" (Zen of cmux). Monetization is a paid Founder's Edition with early access to "cmux AI", an iOS app (TestFlight beta), Cloud VMs (⌘Y "New Cloud workspace") and voice mode ([README](https://github.com/manaflow-ai/cmux)). Manaflow is a YC company ([YC launch](https://www.ycombinator.com/launches/PbB-cmux-the-open-source-terminal-built-for-coding-agents)).
- Traction: Show HN on 2026-02-19 drew 198 points and 77 comments ([HN](https://news.ycombinator.com/item?id=47079718)); the team says it reached #2 on HN and Mitchell Hashimoto shared it ([cmux blog](https://cmux.com/blog/show-hn-launch)). It had 28,393 stars on 2026-10-25 ([GitHub](https://github.com/manaflow-ai/cmux)). The README ships in about 20 languages, including Korean.

**(2) Steering one specific agent mid-run**
- Each agent is just a terminal surface. You click or keyboard-focus its pane and type, use Cmd+Shift+U to jump to the agent that most recently needed you, and use ⌘1–8 to jump between workspaces ([README](https://github.com/manaflow-ai/cmux)).
- Programmatic steering: an orchestrator agent can list workspaces, read their screens and send them messages through the cmux CLI/socket ([artemxtech substack](https://artemxtech.substack.com/p/how-i-manage-10-claude-code-agents); [README](https://github.com/manaflow-ai/cmux)).

**(3) Pop-out / attach and context carry-over**
- `cmux claude-teams` launches Claude Code with agent teams enabled and puts a **tmux shim** first on PATH. The shim translates tmux commands (`split-window`, `send-keys`, `capture-pane`, `new-window`, …) into cmux socket calls, so **teammates appear as native cmux splits**. The feature is labeled experimental because it depends on Claude Code's experimental flag ([cmux docs](https://cmux.com/docs/agent-integrations/claude-code-teams)).
- The README FAQ claims that when an agent "spawns subagents or teammates, cmux turns them into native panes" ([README](https://github.com/manaflow-ai/cmux)). The integration docs, however, only document **teammates**, not ordinary Task-tool subagents ([cmux docs](https://cmux.com/docs/agent-integrations/claude-code-teams)). Treat the subagent claim as unverified.
- Context: a teammate pane is a full Claude Code session, but per Anthropic's docs the lead's conversation history does not carry over; teammates get the project context plus the spawn prompt ([Claude Code docs](https://code.claude.com/docs/en/agent-teams)). cmux does not add context transfer.

**(4) Windows support**: none. "macOS only, for now" ([README](https://github.com/manaflow-ai/cmux)). Issue #1012 "Please bring a windows version" is open with 52 reactions ([#1012](https://github.com/manaflow-ai/cmux/issues/1012)), and #330 "Linux support?" is the repo's most-reacted issue, open with 221 reactions and 57 comments ([#330](https://github.com/manaflow-ai/cmux/issues/330)).

**(5) Pain points, with evidence**
- *Platform lock-in*: #330 (Linux, 221 reactions) and #1012 (Windows, 52) ([#330](https://github.com/manaflow-ai/cmux/issues/330), [#1012](https://github.com/manaflow-ai/cmux/issues/1012)). On GeekNews, a Korean user asked why there is no Windows version ([GeekNews 27598](https://news.hada.io/topic?id=27598)).
- *Unreliable attention signals (the core value prop)*: #1027 "Sidebar 'Running' and 'Needs Input' status indicators are flaky and unreliable" is open with 44 reactions and reports false positives and missed "needs input" states ([#1027](https://github.com/manaflow-ai/cmux/issues/1027)). #2322 "Claude notifications are flaky — inconsistent delay…" is open with 22 ([#2322](https://github.com/manaflow-ai/cmux/issues/2322)). A Korean user on GeekNews reported rendering bugs and `cmux notify` alerts that sometimes don't fire ([GeekNews 27598](https://news.hada.io/topic?id=27598)).
- *Regressions and instability*: "Latest update forces Claude bypass permissions" (v0.64.0, 27 reactions, 20 comments, May 2026) ([#3547](https://github.com/manaflow-ai/cmux/issues/3547)); a severe memory leak that grows to tens of GB and freezes the system (22 reactions, May 2026) ([#4529](https://github.com/manaflow-ai/cmux/issues/4529)); a drag-and-drop regression ([#3435](https://github.com/manaflow-ai/cmux/issues/3435)); and a 0.64.23 release that shipped without `cmuxd-remote`, leaving `cmux ssh` stuck (Sep 2026) ([#12661](https://github.com/manaflow-ai/cmux/issues/12661)). At launch, an HN commenter called it buggy (couldn't switch or close tabs), and the maintainer pointed to a fix in 0.57.0 ([HN comment](https://news.ycombinator.com/item?id=47082157)). The repo has 5,130 issues, 1,780 of them open (GitHub search API, 2026-10-25), which signals heavy churn.
- *Complexity/bloat*: "Ask HN: Why does cmux need 200 settings?" (2026-09-17). The poster couldn't find a setting (turning off the bell wasn't there), found the Xcode build took hours, and forked a stripped-down "simple" branch ([HN](https://news.ycombinator.com/item?id=49743291)). A "Bloat-free, fast cmux for Claude on MacOS" fork, ClaudeTTY, was posted to HN as "An Undying Replacement for Cmux" (2026-10-22) ([HN](https://news.ycombinator.com/item?id=50199096), [repo](https://github.com/aqilc/ClaudeTTY)). Another alternative, colm, was also posted ([HN](https://news.ycombinator.com/item?id=49763381)).
- *Persistence and remote*: requests for pane-layout persistence ([#480](https://github.com/manaflow-ai/cmux/issues/480), 50 reactions), named session save/restore ([#2086](https://github.com/manaflow-ai/cmux/issues/2086), 37), zellij integration for live process preservation ([#1663](https://github.com/manaflow-ai/cmux/issues/1663), 27) and first-class SSH workspaces ([#1664](https://github.com/manaflow-ai/cmux/issues/1664), 38). An HN user reported cmux freezing for 2–10 s with SSH sessions open ([HN](https://news.ycombinator.com/item?id=49285938)).
- *Mixed reception among terminal loyalists*: one HN commenter will stick with Ghostty ([HN](https://news.ycombinator.com/item?id=47080522)); one GeekNews commenter feels iTerm is still better ([GeekNews 27598](https://news.hada.io/topic?id=27598)).

**(6) Opportunity implied**: cmux shows that "agent-aware terminal + attention routing + socket API" is the winning primitive (28k stars in about 9 months). Its weak spots are exactly where a Windows harness can differentiate: no Windows or Linux build, flaky "needs input" detection, opt-in-only live persistence, a sprawling settings surface, and teammate-only pane support (no subagent pop-out, no context transfer).

#### C. Per-tool profiles (other tools)

**claude-squad** ([smtg-ai/claude-squad](https://github.com/smtg-ai/claude-squad))
- Design: Go TUI built on tmux (one tmux session per agent) plus git worktrees (one branch per session). Works with Claude Code, Codex, Aider, OpenCode, Amp, or any program passed via `-p` ([README](https://github.com/smtg-ai/claude-squad)).
- Steer one agent: select a session and press `↵`/`o` to attach and reprompt; `ctrl-q` detaches; `r` resumes a paused session ([README](https://github.com/smtg-ai/claude-squad)).
- Pop-out/context: attaching drops you into that agent's tmux session (full TUI, same process, so context is intact). There is no team or inter-agent messaging.
- Windows: hard tmux dependency, so no native support ([README](https://github.com/smtg-ai/claude-squad); also noted in [Pane README](https://github.com/greenfield-inc/Pane)).
- Pain points: abandonment fears in "No more updates?" (Sep 2025, 16 reactions) ([#214](https://github.com/smtg-ai/claude-squad/issues/214)) and "Project Seems Abandoned, PR's and bugs are not being accepted or fixed." (2026-02-12, 11) ([#250](https://github.com/smtg-ai/claude-squad/issues/250)), although v1.0.20 shipped on 2026-08-20 ([releases](https://github.com/smtg-ai/claude-squad/releases)). tmux fragility shows up in recurring "Error capturing pane content" issues ([#51](https://github.com/smtg-ai/claude-squad/issues/51), [#189](https://github.com/smtg-ai/claude-squad/issues/189), [#216](https://github.com/smtg-ai/claude-squad/issues/216)); there are also "TUI Interactions very slow" ([#215](https://github.com/smtg-ai/claude-squad/issues/215)) and an open request for a worktree environment setup hook covering deps, env files and port isolation ([#260](https://github.com/smtg-ai/claude-squad/issues/260)).
- Opportunity: the simple attach/detach mental model is loved, but tmux-coupling and maintainer bandwidth are liabilities. Users want the same UX without tmux and with Windows support.

**vibe-kanban** ([BloopAI/vibe-kanban](https://github.com/BloopAI/vibe-kanban))
- Design: Rust backend plus web UI launched via `npx vibe-kanban`; a kanban card per task, each in its own worktree. Supports Claude Code, Gemini CLI, Codex, Amp and others ([README](https://github.com/BloopAI/vibe-kanban)).
- Steer one agent: per-task chat/follow-ups; you can review diffs and leave inline comments that are sent straight back to the agent ([README](https://github.com/BloopAI/vibe-kanban)).
- Pop-out: there is no terminal attach to the live agent TUI. Interaction happens through the web UI. Conversation context stays per task.
- Windows: native (the npx CLI ships a `windows-x64` binary) ([cli.ts](https://github.com/BloopAI/vibe-kanban/blob/main/npx-cli/src/cli.ts)).
- Pain points: UI churn backlash with "Bring back old UI" (33 reactions, 39 comments, Feb 2026) ([#2687](https://github.com/BloopAI/vibe-kanban/issues/2687)), "Beta UI feedback: please keep the Kanban board" ([#2509](https://github.com/BloopAI/vibe-kanban/issues/2509)) and "v0.1.13: Confusing Cloud Migration … Regressed UX" ([#2812](https://github.com/BloopAI/vibe-kanban/issues/2812)). The company shut down in April 2026, cloud features were removed, and users asked for local-only projects and better export ([shutdown post](https://vibekanban.com/blog/shutdown), [#3354](https://github.com/BloopAI/vibe-kanban/issues/3354), [#3396](https://github.com/BloopAI/vibe-kanban/issues/3396)). Worktree cleanup is another request ([#765](https://github.com/BloopAI/vibe-kanban/issues/765)).
- Opportunity: the board metaphor is popular for planning, but vendor-death risk and UI churn push users toward local-first tools with stable data ownership.

**Crystal → Nimbalyst** ([stravu/crystal](https://github.com/stravu/crystal), [nimbalyst/nimbalyst](https://github.com/nimbalyst/nimbalyst))
- Design: Electron/TypeScript desktop workspace with parallel sessions in worktrees, a "session kanban", markdown/mockup/diagram editing, an embedded Ghostty terminal, and a session dashboard that shows which agents need you. Mobile companion app ([README](https://github.com/nimbalyst/nimbalyst)).
- Steer one agent: open the session in Agent Manager and chat or resume. Search and resume past sessions ([README](https://github.com/nimbalyst/nimbalyst)).
- Windows: native .exe (Windows 10+) ([README](https://github.com/nimbalyst/nimbalyst)).
- Pain points: Crystal users were forced to migrate (Crystal frozen since 2026-02-26) ([repo](https://github.com/stravu/crystal)). No strong public complaint signal was found for Nimbalyst in the time available.
- Opportunity: a document-centric visual workspace. It is not focused on live terminal-level steering of team members.

**ccmanager** ([kbwo/ccmanager](https://github.com/kbwo/ccmanager))
- Design: Node TUI using its own PTYs, with no tmux. Manages sessions across worktrees for Claude Code, Gemini CLI, Codex, Cursor Agent, Copilot CLI, Cline CLI, OpenCode and Kimi ([README](https://github.com/kbwo/ccmanager)).
- Steer one agent: select a session to enter its live TUI; Ctrl+E returns to the menu ([README](https://github.com/kbwo/ccmanager)).
- Context: can **copy Claude Code session data (conversation history, context) into a newly created worktree**, so a conversation continues on a new branch ([README](https://github.com/kbwo/ccmanager)). This is a form of "fork with context".
- Notable: it auto-appends `--teammate-mode in-process` to `claude` so that Claude's agent teams don't conflict with its PTY handling. As a result, teammates never get their own panes under ccmanager ([README](https://github.com/kbwo/ccmanager)).
- Windows: officially Linux/macOS only. The maintainer said in Jan 2026 that Windows is not a priority and recommended WSL ([#164](https://github.com/kbwo/ccmanager/issues/164)).
- Opportunity: proves demand for tmux-free session management plus context copy, but Windows users are explicitly deprioritized.

**agent-deck** ([asheshgoplani/agent-deck](https://github.com/asheshgoplani/agent-deck))
- Design: Go TUI "mission control" on tmux for Claude, Gemini, OpenCode, Codex and others. Includes MCP/skill attach per session, cost lines, and a "conductor" session that watches workers and escalates to Telegram/Slack/Discord ([README](https://github.com/asheshgoplani/agent-deck)).
- Steer one agent: `Enter` attaches and `Ctrl+Q` detaches. `o` sends a message to the selected session (if Claude is busy the message is queued, with no interrupt). `Shift+Q` queues a message after the current turn. `agent-deck session send … --message-file` does the same from the CLI ([README](https://github.com/asheshgoplani/agent-deck)).
- Pop-out/context: `agent-deck session fork` forks a supported session, duplicating its context into a new session ([README](https://github.com/asheshgoplani/agent-deck)).
- Windows: WSL (WSL2 recommended) ([README](https://github.com/asheshgoplani/agent-deck)).
- Opportunity: "message an agent without attaching and without interrupting it" is a strong pattern worth copying, along with conductor escalation.

**Tmux-Orchestrator** ([Jedward23/Tmux-Orchestrator](https://github.com/Jedward23/Tmux-Orchestrator)), last activity July 2025, possibly outdated
- Design: a three-tier hierarchy (Orchestrator → Project Managers → Engineers) of Claude agents in tmux windows. Agents message each other across tmux windows and schedule their own check-ins; the human interacts with the Orchestrator ([README](https://github.com/Jedward23/Tmux-Orchestrator)).
- Steer one agent: attach to any tmux window and type, or tell the Orchestrator. Windows: tmux, so WSL.
- Opportunity: early proof of the PM/engineer role pattern the user runs today, but it is a script collection, not a product. Successors (Gas Town, OpenRig, multi-agent-shogun) productized it.

**ruflo, formerly claude-flow** ([ruvnet/ruflo](https://github.com/ruvnet/ruflo))
- Design: an "agent meta-harness". Installs as Claude Code plugins (ruflo-core, ruflo-console, ruflo-mods; requires Claude Code ≥2.1.287) or as an MCP server for Codex and others. `npx ruflo tui` runs a console showing Overview, Cost, Swarm and Events ([README](https://github.com/ruvnet/ruflo)).
- Steer one agent: you interact through Claude Code plus ruflo tools/console. I found no per-agent terminal attach in the README.
- Windows: not stated in the README (unverified).
- Opportunity: huge star count (79k), but it centers on swarm orchestration and memory, not per-agent human collaboration. Mod-based "routing and policy enforcement" inside Claude Code is an extension surface a harness could also use.

**Happy** ([slopus/happy](https://github.com/slopus/happy)) and **Omnara** ([omnara-ai/omnara](https://github.com/omnara-ai/omnara))
- Happy design: an original CLI (`happy claude`, `happy codex`) wraps the vendor harness in your terminal and mirrors it to an E2E-encrypted mobile/web app. The newer "Happy Harness" desktop app (macOS, Windows, Linux) orchestrates Claude, Codex and Grok with subagents on any of them, and is "natively multiplayer": two people can watch and steer the same agent ([README](https://github.com/slopus/happy)).
- Steer one agent: per-session chat from phone or desktop. Context stays because it is the same session.
- Omnara has **pivoted**: it is now an "open-source managed agent platform", a self-hostable alternative to Claude Managed Agents and the OpenAI Agents API, rather than a mobile command center ([README](https://github.com/omnara-ai/omnara)).
- Opportunity: remote and mobile steering of a specific session is now table stakes (cmux iOS, Paseo, wmux Fleet on iPhone, herdr clients). A harness should expose per-agent steering over the network.

**opcode, formerly Claudia** ([winfunc/opcode](https://github.com/winfunc/opcode))
- Design: Tauri 2 GUI for Claude Code covering project/session browsing, resume, custom agents, background agents, usage tracking, checkpoints with a branching timeline, and "Fork Sessions" from checkpoints ([README](https://github.com/winfunc/opcode)).
- Windows: listed (Windows 10/11, WebView2) ([README](https://github.com/winfunc/opcode)).
- Pain points: no release since v0.2.0 (2025-08-31) despite 22k stars ([releases](https://github.com/winfunc/opcode/releases)), so it is effectively stale.
- Opportunity: checkpoint/fork UX for Claude sessions remains unclaimed on Windows by an actively maintained tool.

**Superset** ([superset-sh/superset](https://github.com/superset-sh/superset))
- Design: Electron "agentic IDE" with a worktree per task, terminals with tabs/infinite splits/persistent sessions, a browser preview pane per worktree, a built-in chat pane, automations, a `superset` CLI that can "read their terminals", an iPhone/iPad remote, and built-in `superset:*` skills to "orchestrate parallel agents" ([README](https://github.com/superset-sh/superset)).
- Steer one agent: focus its terminal, or send PR diff-line feedback to a running or new agent session ([README](https://github.com/superset-sh/superset)).
- Windows: "not yet available"; Linux AppImage is experimental ([README](https://github.com/superset-sh/superset)). Windows requests: [#2692](https://github.com/superset-sh/superset/issues/2692) (open, 14), [#499](https://github.com/superset-sh/superset/issues/499) and "[feat] WINDOWS NEEDED PLEASE !!!" ([#3207](https://github.com/superset-sh/superset/issues/3207)).
- License: Elastic License 2.0 (source-available), verified via the GitHub license API. Comparison blogs disagree on this ([DEV](https://dev.to/stravukarl/best-tools-for-managing-parallel-ai-coding-agents-in-2026-14l8)).
- Its own README admits that worktrees "do not sandbox processes or prevent merge conflicts" ([README](https://github.com/superset-sh/superset)).

**emdash** ([generalaction/emdash](https://github.com/generalaction/emdash))
- Design: desktop ADE with a worktree per task, diff review, PR/CI/merge, Linear/GitHub/Jira ticket intake, SSH remotes, and local SQLite state. It installs lifecycle hooks in agent configs to track status, notifications and resumable sessions ([README](https://github.com/generalaction/emdash)).
- Windows: native .msi/.exe ([README](https://github.com/generalaction/emdash)).
- Opportunity: a ticket-to-PR pipeline. It has no team/mailbox semantics.

**Jean** ([coollabsio/jean](https://github.com/coollabsio/jean)), from the Coolify org
- Design: Tauri v2 + React + xterm.js. Every task gets a worktree, with multiple sessions per worktree, Plan/Build/Yolo modes, a multi-dock terminal and a built-in browser. Has a headless `jean-server` with web access and "Mr. Robot" issue-to-plan automation ([README](https://github.com/coollabsio/jean)).
- Windows: "Not fully tested" ([README](https://github.com/coollabsio/jean)).

**xum, formerly Coder "mux"** ([coder/mux](https://github.com/coder/mux))
- Design: desktop app with **its own agent loop** (UX inspired by Claude Code), local/worktree/SSH runtimes, a git-divergence UI, cost tracking and a mobile server mode ([README](https://github.com/coder/mux)).
- Windows: binaries for macOS and Linux only ([README](https://github.com/coder/mux)).
- Note: it does not drive the vendor CLIs, so it cannot reuse a Claude Code CLI session.

**Gas Town** ([gastownhall/gastown](https://github.com/gastownhall/gastown))
- Design: Steve Yegge's multi-agent workspace manager. A **Mayor** (a Claude Code instance with full workspace context) is your primary interface; per-project "rigs" have **polecat** workers, a Witness (lifecycle/stuck-agent recovery), a Refinery (Bors-style merge queue), escalation routing and a scheduler that caps polecat concurrency to avoid rate limits. Built-in **mailboxes, identities and handoffs**, plus `gt seance --talk` for one-shot questions. tmux-backed roles; claims to scale to 20–30 agents ([README](https://github.com/gastownhall/gastown)).
- Steer one agent: talk to the Mayor, or attach to a role's tmux session.
- Windows: native CLI is minimal; "for full tmux-backed workflows on Windows, use WSL" ([README](https://github.com/gastownhall/gastown)).
- Pain points: the v1.0 HN thread called it vibe-designed, with layer upon layer of agent types (mayor, polecats, witnesses, deacons, dogs…) and incomprehensible constructs. Another commenter built a 10x simpler alternative: one main agent you talk to that dispatches subagents which communicate and wake each other ([HN](https://news.ycombinator.com/item?id=47771755), [HN](https://news.ycombinator.com/item?id=47772062)). An agent-teams HN thread also described Gas Town and another orchestrator as "too rigid and opinionated" ([HN](https://news.ycombinator.com/item?id=47604859)).
- Opportunity: the mailbox, identity and merge-queue concepts are valuable, but the ontology is a barrier. A simpler "lead + named members you can talk to" model wins.

**Maestro** ([RunMaestro/Maestro](https://github.com/RunMaestro/Maestro))
- Design: cross-platform desktop app (a pass-through to provider CLIs; MCP, skills and auth unchanged). Each agent has its own workspace, history and context, plus an AI terminal and a command terminal (Cmd/Ctrl+J). Auto Run playbooks run each task in a fresh session. **Group Chat**: one agent is appointed moderator and routes the question to the right agents. **Cross-agent mentions**: `@another-agent` consults another agent inline by forwarding a slice of the conversation. Also message queueing, session discovery/import of pre-existing sessions, and cost tracking ([README](https://github.com/RunMaestro/Maestro)).
- Windows: yes (Windows/Linux shortcuts documented) ([README](https://github.com/RunMaestro/Maestro)).
- Opportunity: closest GUI analogue to "team + talk to each member". A harness can match it while staying terminal-native.

**oh-my-claudecode (OMC)** ([Yeachan-Heo/oh-my-claudecode](https://github.com/Yeachan-Heo/oh-my-claudecode)), Korean author (Seoul)
- Design: a Claude Code plugin with role agents (planner, architect, executor, verifier, critic…) and modes (autopilot, ralph, ultrawork…). Two team surfaces: `/team …` uses Claude Code's in-session native agent teams, and `omc team N:codex|gemini|claude|cursor|grok "…"` spawns **real CLI workers in tmux split panes** that die when their task completes. A sister project, oh-my-codex, does the same for Codex ([README](https://github.com/Yeachan-Heo/oh-my-claudecode); Korean guides on [velog](https://velog.io/@jade_95/OMX%EC%99%80-OMC-%EC%9A%94%EC%95%BD-%EC%A0%95%EB%A6%AC)).
- Windows: native via **psmux** (a native tmux for Windows), or tmux inside WSL2 ([README](https://github.com/Yeachan-Heo/oh-my-claudecode)).
- Opportunity: proves that Korean builders adopt prompt-defined role teams at massive scale (40k stars). Workers are ephemeral, though, and the user can't keep collaborating with one after it finishes.

**OpenRig** ([mvschwarz/openrig](https://github.com/mvschwarz/openrig))
- Design: persistent agent "teams with roles, shared context and owned work" built from Claude Code, Codex and Pi. You talk to a lead/"kernel operator"; seats run in tmux or Herdr; `rig tui` is the dashboard; `rig terminal open saved:kernel --window` opens a new terminal tab or window and "preserves existing conversations" ([README](https://github.com/mvschwarz/openrig)).
- Windows: WSL2 only, and automated tests don't run on WSL2 ([README](https://github.com/mvschwarz/openrig)).
- Opportunity: conceptually the closest to the user's goal (persistent named role seats you can open in their own terminal). It is blocked on Windows.

**Orchestrator.inc agent-orchestrator** ([OrchestratorInc/agent-orchestrator](https://github.com/OrchestratorInc/agent-orchestrator))
- Design: desktop app plus local daemon. A **worker** is one task, one agent and one isolated workspace. A persistent **project orchestrator** plans, spawns and redirects workers and passes them context. You can "open a worker at any time to continue the conversation, attach to its terminal", inspect changes, use its isolated browser, or send CI and review feedback back to the same agent. Both structured Chat and the agent's native TUI are supported ([README](https://github.com/OrchestratorInc/agent-orchestrator)).
- Windows: native download ([README](https://github.com/OrchestratorInc/agent-orchestrator)).
- Caveat: telemetry includes an installation ID and GitHub username ([README](https://github.com/OrchestratorInc/agent-orchestrator)).

**Runner** ([yicheng47/runner](https://github.com/yicheng47/runner)), alpha
- Design: reusable **crews** (saved roles + lead + shared conventions) launched as **missions**. Each crew slot gets a live terminal and there is a shared mission feed where agents coordinate and bring questions to you. You can stop, resume or restart one slot without touching the rest. Each agent keeps its own TUI in a real PTY (alacritty_terminal grid; IME input supported). Sessions live in the `runnerd` background service, so agents keep working when the app closes. A `runner` CLI starts crews and follows feeds ([README](https://github.com/yicheng47/runner)).
- Windows: native Windows x64, bundling ConPTY ([README](https://github.com/yicheng47/runner)).
- Opportunity: the most direct existing match to "team + talk to each member in its own terminal, on Windows". It is very early (376 stars, alpha) and China-centric (remote control is a private beta in mainland China).

**wmux by openwong2kim** ([openwong2kim/wmux](https://github.com/openwong2kim/wmux))
- Design: Electron app (ConPTY on Windows, forkpty on macOS) with tmux-style splits and prefix keys plus session persistence. **Fleet** (Ctrl+Shift+A) is a cross-workspace attention list (Needs you → Ready to review → Running → Idle). **Multi Task** splits one prompt into up to 8 worktree tasks with hunk-level adopt. "Bots" are handed jobs in chat. **Agents in different panes message each other via `send_message`** (e.g., Claude Code asks the Codex pane for a review). Claude Code questions and permission prompts can be answered from an iPhone. Panes pause on usage limits and hold queued messages ([README](https://github.com/openwong2kim/wmux)).
- Windows: native, no WSL. Signing is pending, so SmartScreen/Smart App Control warnings appear ([README](https://github.com/openwong2kim/wmux)).

**wmux by amirlehmam** ([amirlehmam/wmux](https://github.com/amirlehmam/wmux))
- Design: a from-scratch Windows reimplementation inspired by cmux: notification rings and center, Windows toasts, taskbar flash, a named-pipe JSON-RPC API (`\\.\pipe\wmux`) to create workspaces, split panes, send keystrokes, read terminal content, control a CDP browser and "spawn sub-agent terminals programmatically". It observes Claude Code passively via hooks. A `report-subagent` channel lists **each subagent's ID/name in the sidebar** and marks each done. v2.0 detects non-hooked agents through rules ([README](https://github.com/amirlehmam/wmux)).
- Why it exists: the author says Windows Terminal has tabs but no notification system, and tmux in WSL "loses all Windows integration" ([README](https://github.com/amirlehmam/wmux)).

**psmux** ([psmux/psmux](https://github.com/psmux/psmux))
- Design: native Windows terminal multiplexer in Rust on ConPTY. It speaks the tmux command language and reads `.tmux.conf` ([README](https://github.com/psmux/psmux)).
- Key capability: **Claude Code agent teams spawn teammates in separate psmux panes on native Windows**. psmux sets `TMUX`, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and injects `--teammate-mode tmux`. It requires PowerShell 7+ ([psmux docs](https://github.com/psmux/psmux/blob/HEAD/docs/claude-code.md)).
- Critical caveat: Claude Code's subagent tool has two paths. Named teammates go to visible panes. `isolation: "worktree"` agents run in-process and invisible. On Windows, worktree-tmux integration is hardcoded off, and no setting forces those agents into panes; Opus tends to choose worktree isolation. The only workaround is a best-effort CLAUDE.md instruction to use teammates ([psmux docs](https://github.com/psmux/psmux/blob/HEAD/docs/claude-code.md)).

**Herdr** ([herdrdev/herdr](https://github.com/herdrdev/herdr))
- Design: a single Rust binary ("no electron") that runs inside whatever terminal you use. It keeps terminals alive in a background server (detach/reattach; restore and resume after restart) and marks every pane working/blocked/idle. It is agent-native: agents drive it through its CLI/socket to **spawn panes, prompt each other, and wait until another agent is genuinely blocked**. Supports plugins, multi-machine SSH and tmux-style prefix keys plus mouse ([README](https://github.com/herdrdev/herdr)). Herdr joined Y Combinator in Aug 2026 and "the runtime stays open" ([HN](https://news.ycombinator.com/item?id=49201003)). It was relicensed from AGPL-3.0 to Apache-2.0 ([#1340](https://github.com/herdrdev/herdr/issues/1340)).
- Windows: native via ConPTY. Local persistent sessions and attach from Windows Terminal/PowerShell work. **Partial**: CJK IME composition and **Korean prefix input switching**, which depend on the outer terminal. **Not supported** on Windows: `herdr terminal attach` and live server handoff ([herdr docs](https://herdr.dev/docs/windows-beta/)). One Windows bug report: "herdr fires curl cmd windows periodically" ([#1468](https://github.com/herdrdev/herdr/issues/1468)).
- Pain points: "60Hz Limit" is the top open issue with 32 reactions ([#1134](https://github.com/herdrdev/herdr/issues/1134)).
- Opportunity: Herdr is becoming the cross-platform substrate (OpenRig uses it; there are third-party GPUI, web and mobile clients). A harness could build on Herdr instead of competing, but must handle the Korean IME caveats on Windows.

**Paseo** ([getpaseo/paseo](https://github.com/getpaseo/paseo))
- Design: a local daemon manages agents. Desktop, mobile, web and CLI clients connect to it. Agents run in their own worktrees, and "agents in Paseo can create worktrees, launch other agents, and talk to them, across providers". No telemetry or forced login. Plugins run on the daemon and appear in every client ([README](https://github.com/getpaseo/paseo); [HN maintainer comment](https://news.ycombinator.com/item?id=48380782)).
- Windows: macOS/Windows/Linux ([HN](https://news.ycombinator.com/item?id=48380782)).
- Signals: requests to "use existing sessions from Agents CLIs" ([#237](https://github.com/getpaseo/paseo/issues/237)) and a question about the Claude provider roadmap after Agent SDK billing changes ([#1029](https://github.com/getpaseo/paseo/issues/1029)). The latter hints at platform-policy risk for third-party harnesses that drive Claude subscriptions.

**Others briefly**
- dmux: a tmux pane plus worktree per task, AI branch naming, merge/PR from the pane menu, resumes the agent conversation when a pane is recreated, macOS notifications ([README](https://github.com/standardagents/dmux)).
- agent-of-empires: TUI plus web for mobile access, tmux-based, "Only through WSL2" ([README](https://github.com/agent-of-empires/agent-of-empires)).
- Pane: terminal-first, any OS, with `runpane handoff` to continue a session on another machine. Its "Windows Problem" section claims Windows AI-tool UX is "broken across the board" (vendor claim) ([README](https://github.com/greenfield-inc/Pane)).
- abtop: monitors Claude Code/Codex sessions, tokens, context window and rate limits, natively on Windows ([README](https://github.com/graykode/abtop)).
- kmux (macOS, Korean author kkd927): a Show GN post; motivated by scattered terminal windows and sessions when running Claude/Codex/Gemini for different roles, plus usage visibility and continuity ([GeekNews 29660](https://news.hada.io/topic?id=29660)).
- comux, "tmux for AI coding agents", was also posted to GeekNews ([GeekNews 31859](https://news.hada.io/topic?id=31859)) (not read in detail).

### Inferences
- The "attention-routing terminal" category (cmux → wmux/Herdr/comux/kmux/ClaudeTTY/colm) is the fastest-growing and most cloned pattern of 2026. The Windows clones are young (<500 stars) and fragmented (at least two different "wmux" projects plus vmux, astral-terminal, TerminalVibe, cmuxw), so no Windows-native category leader exists yet.
- The OSS leaders by stars (ruflo, oh-my-claudecode, Gas Town) are orchestration layers that optimize autonomy. The terminal/GUI leaders optimize visibility. Very few tools optimize ongoing human-to-specific-agent collaboration inside a team. Runner, Maestro, OpenRig, Orchestrator.inc, wmux (openwong2kim) and Paseo are the exceptions, and they are young or have platform gaps.
- Tool mortality is high: vibe-kanban's vendor died, Crystal was deprecated, 1code was archived, opcode is stale, claude-squad had an "abandoned" scare, Omnara pivoted, and Herdr, Paseo and Mux/Xum changed license or name. A harness should store team state in open, file-based formats so users aren't locked in.

### Gaps
- No Reddit data: reddit.com is blocked for this crawler (search and JSON). X/Twitter and YouTube walkthroughs were not reviewed.
- Windows behavior was verified only from READMEs and docs, not hands-on. ruflo's Windows status is unverified.
- No independent usage metrics (installs, MAU) were found; stars are only a proxy. For opcode especially, stars far exceed current activity.

---

## Q2. How do tools let the human address ONE specific agent mid-run, and can an agent created as a subagent inside one session be "promoted" into its own interactive session with context intact?

### Takeaway
Tools use five steering mechanisms: (a) **attach to the agent's own terminal** (tmux attach in claude-squad and agent-deck; focus a pane in cmux, wmux, Herdr, psmux); (b) **per-agent chat box or card** (vibe-kanban, Nimbalyst, Superset, Maestro, Paseo, Orchestrator.inc); (c) **send without attaching** (agent-deck `o`/`Shift+Q` queueing, cmux/wmux/Herdr socket `send`, Gas Town mail); (d) **talk to a lead who relays** (Gas Town Mayor, OpenRig operator, Tmux-Orchestrator, ruflo); (e) **@mention another agent** (Maestro). Every community tool manages **separately launched top-level sessions** or vendor teammates. I found **no OSS tool that takes an existing in-session subagent and pops it out post-hoc into its own terminal tab while keeping its live context and team membership**. The closest options are spawn-time pane placement of Claude Code teammates (cmux shim, psmux, tmux) and fork/copy-context features (ccmanager, agent-deck, opcode, Claude's `/fork`), and both of those sever team membership.

### Cited Findings
- **Attach model**: claude-squad attaches with `↵/o` to reprompt and detaches with `ctrl-q` ([README](https://github.com/smtg-ai/claude-squad)). agent-deck attaches with `Enter` and detaches with `Ctrl+Q` ([README](https://github.com/asheshgoplani/agent-deck)). ccmanager enters a session and returns with `Ctrl+E` ([README](https://github.com/kbwo/ccmanager)). Herdr detaches with `ctrl+b q` and reattaches with `herdr` ([README](https://github.com/herdrdev/herdr)).
- **Send-without-attach**: in agent-deck, `o` sends to the selected session (a busy Claude session queues it with no interrupt) and `Shift+Q` queues a message after the current turn ([README](https://github.com/asheshgoplani/agent-deck)). cmux and amirlehmam/wmux expose send-keystroke and read-screen APIs ([cmux README](https://github.com/manaflow-ai/cmux), [wmux README](https://github.com/amirlehmam/wmux)).
- **Per-agent chat in GUIs**: vibe-kanban sends inline diff comments to the agent ([README](https://github.com/BloopAI/vibe-kanban)). Superset sends PR feedback to a running or new agent session ([README](https://github.com/superset-sh/superset)). In Orchestrator.inc you open any worker to continue the conversation or attach to its terminal ([README](https://github.com/OrchestratorInc/agent-orchestrator)). Maestro gives each agent its own chat plus `@another-agent` mentions ([README](https://github.com/RunMaestro/Maestro)).
- **Spawn-time panes for Claude teammates**: cmux `claude-teams` uses a tmux shim, so teammates become native splits ([cmux docs](https://cmux.com/docs/agent-integrations/claude-code-teams)). psmux gives native Windows panes for teammates ([psmux docs](https://github.com/psmux/psmux/blob/HEAD/docs/claude-code.md)). OMC `omc team` creates tmux worker panes ([README](https://github.com/Yeachan-Heo/oh-my-claudecode)). The panes exist only if the agent was spawned as a teammate. psmux documents that worktree-isolated subagents stay invisible and in-process, and that this cannot be overridden on Windows ([psmux docs](https://github.com/psmux/psmux/blob/HEAD/docs/claude-code.md)).
- **Fork/copy context**: ccmanager copies Claude Code session data into a new worktree ([README](https://github.com/kbwo/ccmanager)). agent-deck has `session fork` ([README](https://github.com/asheshgoplani/agent-deck)). opcode has "Fork Sessions" from checkpoints ([README](https://github.com/winfunc/opcode)). Claude Code's `/fork` stays in the same terminal; issue #24123 asks for it to open in a new terminal tab (open, 34 reactions) ([#24123](https://github.com/anthropics/claude-code/issues/24123)). cc-outline, a small viewer, can continue a session "in a new terminal tab" from its Sessions view in Windows Terminal or tmux ([README](https://github.com/hopp1395/cc-outline)).
- **Promotion requests turned down or missing**: "Allow existing Claude Code sessions to join a team as teammates" was closed as **not planned** on 2026-03-23. Its author noted that teams can only form by spawning fresh subprocesses, so built-up context is lost and tokens are burned re-reading files ([#24294](https://github.com/anthropics/claude-code/issues/24294)).
- **Subagent follow-up breakage (first-party, for contrast)**: the Claude Code **desktop app** launched the CLI with `--disallowedTools SendMessage`, so subagents could not be messaged or resumed with context. Every follow-up required spawning a fresh agent and re-explaining. The bug was closed as completed on 2026-09-15 ([#92183](https://github.com/anthropics/claude-code/issues/92183)). Earlier, SendMessage-based subagent resumption was gated behind the agent-teams flag ([#35240](https://github.com/anthropics/claude-code/issues/35240), [#42737](https://github.com/anthropics/claude-code/issues/42737), [#38183](https://github.com/anthropics/claude-code/issues/38183) still open, 32 reactions).
- **First-party state for contrast (Oct 2026)**: Claude Code's agent panel lets you select a teammate with the arrow keys and press Enter to open its transcript and message it directly; Escape interrupts it. In split-pane mode you click into the pane. While agent teams are enabled, a subagent Claude **names** launches as a teammate. Split panes need tmux or iTerm2 and are "not supported in VS Code's integrated terminal, Windows Terminal, or Ghostty". The lead's conversation history does not carry over to teammates ([Claude Code docs](https://code.claude.com/docs/en/agent-teams)). An HN commenter in Aug 2026 said Claude Code now lets you talk to subagents directly and watch them ([HN](https://news.ycombinator.com/item?id=49226024)). Codex closed "Add an Agent View for managing multiple Codex agents from the TUI" as completed on 2026-09-09; the request included jumping directly into an agent session from a status list ([#22321](https://github.com/openai/codex/issues/22321)).
- **Regressions elsewhere**: an HN commenter lamented that OpenCode briefly let them talk to subagents directly and then removed it ([HN](https://news.ycombinator.com/item?id=48681090)).
- **New "subagent pane" mods (Sep–Oct 2026, tiny)**: agentpane is a Claude Code mod that lists each subagent with live tool calls and tokens. Clicking one switches the main view to its transcript, and a stop button is available ([README](https://github.com/xuanji86/claude-agentpane)). claude-agent-tree is similar ([repo](https://github.com/pedrowillen/claude-agent-tree)). These provide visibility and stop control, not a separate interactive terminal.

### Inferences
- In practice, "talking to one agent" means either (1) the agent was launched as its own top-level session (attach works and context is native), or (2) it is a vendor teammate (first-party view or messaging). Plain subagents remain second-class: visible at best through mods, steerable only via the parent.
- The user's desired "pop-out" has two technically distinct variants: (a) **re-host**, which moves the same live agent process or session into a new Windows Terminal tab or pane (only possible if the agent runs as a separate process, i.e., a teammate, not an in-process subagent); and (b) **fork with handoff**, which copies the transcript into a new session (it breaks team membership unless the harness re-registers it in the mailbox). No surveyed OSS tool does (a) on Windows Terminal or (b) with automatic team re-registration.
- Because Claude Code's model decides between teammate and worktree subagent, a harness that guarantees "every role agent is pop-out-able" must control spawning itself, for example by launching each role as its own `claude`/`codex` process with a shared mailbox, rather than relying on in-session subagents.

### Gaps
- I did not verify whether Claude Code subagent transcripts (sidechain files) can be resumed as standalone interactive sessions via `--resume`. That would determine whether a post-hoc pop-out of a plain subagent is feasible.
- Codex's post-#22321 Agent View behavior (whether you can type into a subagent thread) was not verified beyond the issue text.

---

## Q3. Does any tool combine agent-to-agent communication (team/mailbox/shared task list) WITH direct human chat to each member at the same time?

### Takeaway
Yes, several do, but none is a mature Windows-native terminal product. Combinations exist in Gas Town (mailboxes + Mayor + attachable tmux roles), OpenRig (persistent role seats + open any seat's terminal), Maestro (moderated group chat + @mentions + per-agent chat; Windows OK), wmux by openwong2kim (`send_message` between panes + each pane interactive + Fleet; Windows-native), Runner (crew + shared mission feed + each slot's own TUI; Windows alpha), Herdr (agents prompt each other via CLI/socket + you interact per pane; Windows-native with IME caveats), Paseo (agents launch and talk to agents + per-agent chat; Windows OK) and Orchestrator.inc (orchestrator coordinates workers + you can open or attach any worker; Windows OK). First-party Claude Code agent teams also combine mailbox + shared task list + direct teammate messaging, but split panes are tmux/iTerm2-only. On Windows, psmux is the workaround.

### Cited Findings
- Gas Town: "Built-in mailboxes, identities, and handoffs"; the Mayor as the primary coordinator; tmux-backed roles; `gt seance --talk` for questions ([README](https://github.com/gastownhall/gastown)).
- OpenRig: persistent teams "with roles, shared context and owned work"; talk to a lead; `rig terminal open … --window` opens the seat's terminal in a new tab or window and preserves conversations; WSL2-only on Windows ([README](https://github.com/mvschwarz/openrig)).
- Maestro: Group Chat with an appointed moderator that routes and follows up; Cross-Agent Mentions; each agent has its own conversation history ([README](https://github.com/RunMaestro/Maestro)).
- wmux (openwong2kim): agents in different panes message each other through wmux whichever CLI they run; Fleet attention list; native Windows ([README](https://github.com/openwong2kim/wmux)).
- Runner: each mission gives every crew slot a live terminal and a shared feed where agents coordinate and bring questions to you; per-slot stop/resume/restart ([README](https://github.com/yicheng47/runner)).
- Herdr: agents "spawn panes, prompt each other, and wait until another agent is genuinely blocked"; per-pane working/blocked/idle states ([README](https://github.com/herdrdev/herdr)).
- Paseo: agents can create worktrees, launch other agents and talk to them across providers ([README](https://github.com/getpaseo/paseo)).
- Orchestrator.inc: a project orchestrator spawns and redirects workers and passes them context; you can open any worker to chat or attach ([README](https://github.com/OrchestratorInc/agent-orchestrator)).
- Claude Code agent teams (first-party contrast): a mailbox JSON file per agent under `~/.claude/teams/{team}/inboxes/`, a shared task list with file-locking claims, and "You can also talk to any teammate directly without going through the lead". Limits: one team per session, no nested teams, the lead is fixed, and in-process teammates are not restored by `/resume` ([docs](https://code.claude.com/docs/en/agent-teams)). The Korean GeekNews summary of the feature repeats that split panes don't work in Windows Terminal ([GeekNews 26439](https://news.hada.io/topic?id=26439)).
- Reliability problems with first-party team messaging: "Teammates don't poll inbox — messages never delivered" ([#23415](https://github.com/anthropics/claude-code/issues/23415)); "teammates intermittently stop receiving SendMessage" ([#34668](https://github.com/anthropics/claude-code/issues/34668)); "lead session stops processing teammate responses until manual keystroke" ([#38932](https://github.com/anthropics/claude-code/issues/38932)); "lead session loops on idle notifications … burns ~13–22% of input tokens on no-op ack" (open) ([#47930](https://github.com/anthropics/claude-code/issues/47930)).

### Inferences
- The design space has converged on a **mailbox (file or socket) + lead/moderator + addressable named members** model. The differentiator left open is a **Windows-native, terminal-native** implementation where every member is a real interactive CLI session (Claude Code or Codex) in Windows Terminal tabs or panes, and where the human can join any member's conversation without breaking the team protocol.
- Mixed-vendor teams (Claude + Codex) with a2a messaging exist only in wmux (openwong2kim), Herdr, Paseo, Runner and OMC (`omc team N:codex`). First-party teams are single-vendor.

### Gaps
- None of the community a2a claims were tested hands-on. The actual reliability of Runner's, wmux's and Herdr's inter-agent messaging is unknown.

---

## Q4. What recurring pain points does the community report? (HN, GitHub, Korean communities; Reddit inaccessible)

### Takeaway
Ten pain points recur across sources:
1. **Opacity of subagents**: you only see the final, often sanitized summary.
2. **Inability to follow up with a specific sub-agent without re-explaining context.**
3. **"Which agent needs me?"**: attention routing, which existing tools detect unreliably.
4. **Terminal/tab sprawl and cognitive load.**
5. **tmux dependency and the Windows gap.**
6. **Worktree merge conflicts and the review bottleneck.**
7. **Token/rate-limit burn from parallelism.**
8. **Context loss on handoff and compaction.**
9. **Over-engineered orchestrators and settings bloat.**
10. **Tool churn and abandonment.**

### Cited Findings
- **Opacity / only-the-summary**: on the agents-observe HN thread, a user said that when a coordinator spawns builder/reviewer/tester agents, the only visibility is what they choose to report back, which is often sanitized and overly optimistic ([HN](https://news.ycombinator.com/item?id=47605971)). Blogs explain that subagents return a single final message and coordination flows only through the orchestrator ([wmedia](https://wmedia.es/en/tips/claude-code-subagent-context-loss)). Older GitHub asks include "Subagent logs?" (2025) ([#2685](https://github.com/anthropics/claude-code/issues/2685)) and SubagentStop hooks being unable to identify which subagent finished (2025) ([#7881](https://github.com/anthropics/claude-code/issues/7881)). For Codex: "Multi-agent V2 regression: subagent instructions are no longer observable" ([#32753](https://github.com/openai/codex/issues/32753)) and "Subagents panel no longer shows each agent's model or reasoning effort" (open, 20) ([#32283](https://github.com/openai/codex/issues/32283)). The Sept–Oct 2026 wave of "subagent pane" mods (agentpane, claude-agent-tree, cc-outline) exists to fill this gap ([agentpane](https://github.com/xuanji86/claude-agentpane), [cc-outline](https://github.com/hopp1395/cc-outline)).
- **Can't follow up / context loss**: the desktop app blocked SendMessage, so every follow-up meant a fresh agent plus re-explanation ([#92183](https://github.com/anthropics/claude-code/issues/92183)). Teams can't adopt existing sessions, so context is lost and tokens are burned ([#24294](https://github.com/anthropics/claude-code/issues/24294), closed not planned). On HN: wishes for a clean way to compact a conversation into a handoff prompt ([HN](https://news.ycombinator.com/item?id=49225326)), and Simon Willison saying he is fed up with compaction and wants searchable access to prior conversation ([HN](https://news.ycombinator.com/item?id=49226703)).
- **Attention routing**: cmux's raison d'être was Claude's context-free "waiting for input" notifications ([README](https://github.com/manaflow-ai/cmux)), yet cmux status indicators and notifications are reported flaky ([#1027](https://github.com/manaflow-ai/cmux/issues/1027), [#2322](https://github.com/manaflow-ai/cmux/issues/2322); [GeekNews](https://news.hada.io/topic?id=27598)). wmux's author cites the same gap on Windows Terminal ([README](https://github.com/amirlehmam/wmux)). The Codex Agent View request asks for running / needs-input / idle / done / error statuses ([#22321](https://github.com/openai/codex/issues/22321)).
- **Terminal sprawl and cognitive load**: the kmux author built a tool because running several agents for different roles scattered windows and sessions ([GeekNews 29660](https://news.hada.io/topic?id=29660)). The author of the "parallel coding agents with tmux" post said merge conflicts and cognitive load are the two big struggles ([HN](https://news.ycombinator.com/item?id=47222888)). Pane's README describes "twelve terminal windows" and alt-tabbing (vendor framing) ([README](https://github.com/greenfield-inc/Pane)). An HN commenter believes about 8 agents per human is a practical ceiling without new tooling ([HN](https://news.ycombinator.com/item?id=47221691)).
- **tmux and Windows gap**: Claude Code split panes require tmux or iTerm2 and aren't supported in Windows Terminal ([docs](https://code.claude.com/docs/en/agent-teams)). The Windows Terminal backend request remains open with 50 reactions ([#24384](https://github.com/anthropics/claude-code/issues/24384)). Guides tell Windows users to install WSL2 and tmux ([ardalis](https://ardalis.com/setting-up-claude-code-agent-teams-with-wsl2-and-tmux-on-windows/)); a Korean GitHub guide covers the same setup ([treylom](https://github.com/treylom/claude-agent-teams-setup)). Tool maintainers deprioritize Windows ([ccmanager #164](https://github.com/kbwo/ccmanager/issues/164)), and Mac-only tools draw Windows requests ([cmux #1012](https://github.com/manaflow-ai/cmux/issues/1012); [Superset #2692](https://github.com/superset-sh/superset/issues/2692)). Codex on Windows/WSL has its own friction: "Codex App is Unusable Slow with WSL as Agent environment" (open, 41) ([#25715](https://github.com/openai/codex/issues/25715)), WSL project creation failures (open, 70) ([#41290](https://github.com/openai/codex/issues/41290)), and terminal windows flashing after the Codex daemon install (164 reactions, closed) ([#48074](https://github.com/openai/codex/issues/48074)).
- **Merge conflicts and review**: Superset says worktrees don't prevent merge conflicts ([README](https://github.com/superset-sh/superset)). A Show HN for "Foremerge – Catch intent conflicts between parallel coding agents" scored 45 points ([HN](https://news.ycombinator.com/item?id=49789356)). HN users report bad agent merges ([HN](https://news.ycombinator.com/item?id=47222482)).
- **Cost and rate limits**: parallel agent teams hit Max plan limits in under an hour for one HN user ([HN](https://news.ycombinator.com/item?id=47221592)). Another can't get more than one or two agents going before hitting limits ([HN](https://news.ycombinator.com/item?id=47603964)). Usage-limit issues are among Claude Code's most reacted: [#16157](https://github.com/anthropics/claude-code/issues/16157) (726 reactions, 1,499 comments) and [#38335](https://github.com/anthropics/claude-code/issues/38335) (544). Codex: "Launching concurrent subagents instantly drains entire Pro plan usage quota" ([#9748](https://github.com/openai/codex/issues/9748)). Runaway subagent recursion is reported in [#68619](https://github.com/anthropics/claude-code/issues/68619) and [#68110](https://github.com/anthropics/claude-code/issues/68110). A Korean guide claims teams in plan mode cost about 7× a solo session (blog claim) ([wikidocs](https://wikidocs.net/blog/@openwiki/27905/)).
- **Permission-prompt fatigue**: agent teams without skip-permissions mean "endless approvals" ([HN](https://news.ycombinator.com/item?id=47223928)). Anthropic's docs list "Too many permission prompts" as a known friction because teammate prompts bubble up to the lead ([docs](https://code.claude.com/docs/en/agent-teams)).
- **Over-engineering and bloat**: Gas Town critiques ([HN](https://news.ycombinator.com/item?id=47771755)); cmux's 200 settings and hours-long build ([HN](https://news.ycombinator.com/item?id=49743291)); an orchestrator described as too rigid and opinionated ([HN](https://news.ycombinator.com/item?id=47604859)).
- **Churn and abandonment**: the vibe-kanban shutdown ([post](https://vibekanban.com/blog/shutdown)); claude-squad "abandoned" issue ([#250](https://github.com/smtg-ai/claude-squad/issues/250)); 1code archived ([repo](https://github.com/21st-dev/1code)); opcode with no release since Aug 2025 ([releases](https://github.com/winfunc/opcode/releases)); Codex hook misattribution to the wrong TMUX_PANE breaking pane-aware tools (0.157 regression) ([#48500](https://github.com/openai/codex/issues/48500)).
- **Korean community specifics**: GeekNews readers asked for a Windows version of cmux and reported notify/rendering bugs ([GeekNews 27598](https://news.hada.io/topic?id=27598)). Korean authors build agent tooling at scale: oh-my-claudecode (40k), abtop and kmux ([OMC](https://github.com/Yeachan-Heo/oh-my-claudecode), [abtop](https://github.com/graykode/abtop), [kmux](https://news.hada.io/topic?id=29660)). Herdr documents only partial support for Korean prefix input switching on Windows ([herdr docs](https://herdr.dev/docs/windows-beta/)), a Korean-specific risk for Windows terminal harnesses.

### Inferences
- The pain the user describes ("I only see the final synthesis; I can't easily instruct one role agent") is not idiosyncratic. It is the top recurring complaint category, and both vendors shipped partial first-party fixes in 2026 (Claude's agent panel and teammate messaging, Codex Agent View). Those fixes stay inside one terminal view, require tmux/iTerm2 for real panes, and broke in the Claude desktop app until Sept 2026.
- On Windows the problems compound: tmux-based tools need WSL, which loses Windows integration; Windows-native clones are immature; and Korean IME handling is a known weak spot for terminal multiplexers on Windows.

### Gaps
- Reddit (r/ClaudeAI, r/ClaudeCode, r/ChatGPTCoding, r/codex), X/Twitter and YouTube could not be accessed or reviewed. Their sentiment may differ, especially on cost.
- Disquiet and Korean Claude Code user groups (e.g., KakaoTalk or Discord groups) were not reachable. Korean evidence is limited to GeekNews, velog, wikidocs and Korean GitHub authors.

---

## Q5. What feature requests exist in anthropics/claude-code and openai/codex about interacting with individual subagents/teammates, popping them out, or Windows Terminal pane support?

### Takeaway
Claude Code's tracker has a cluster of open, well-supported requests to **decouple teammate panes from tmux** (Windows Terminal, WezTerm, Ghostty, Zellij, cmux, plus a generic CustomPaneBackend protocol). It also has requests to open `/fork` in a new tab and to let existing sessions join a team; the latter was rejected as not planned. Several SendMessage/resume bugs block follow-ups to subagents. Codex's tracker centers on multi-agent observability and an Agent View, which was implemented by Sept 2026. Neither tracker has a high-vote issue titled exactly "pop a subagent out into its own terminal".

### Cited Findings
Reactions are totals as of 2026-10-25, with 👍 counts in parentheses where captured.

**anthropics/claude-code: pane backends / Windows**
- #24384 "[FEATURE] Add Windows Terminal as a split-pane backend for agent teams (teammateMode)". Open, 50 (39 👍), 13 comments, 2026-02-09. It proposes `"windows-terminal"` with auto-detection via `WT_SESSION`; today users must choose in-process mode, WSL+tmux, or fragile hook scripts ([#24384](https://github.com/anthropics/claude-code/issues/24384)).
- #24122 "Agent Teams: Add zellij terminal multiplexer support for split-pane mode". Open, 96 (95) ([#24122](https://github.com/anthropics/claude-code/issues/24122)).
- #24189 "[Feature Request] Add Ghostty as a split-pane backend for agent teams (teammateMode)". Open, 74 (71) ([#24189](https://github.com/anthropics/claude-code/issues/24189)).
- #31901 "Feature request: Native Zellij support as alternative to tmux for Agent Teams and /terminal-setup". Open, 72 (71) ([#31901](https://github.com/anthropics/claude-code/issues/31901)).
- #23574 "[FEATURE] Add WezTerm as a split-pane backend for agent teams (teammateMode)". Open, 48 (37) ([#23574](https://github.com/anthropics/claude-code/issues/23574)).
- #26572 "Proposal: CustomPaneBackend protocol — decouple agent teams from tmux CLI…". Open, 30 (28). Filed by the creator of KILD, who reverse-engineered what Claude Code needs from a pane backend ([#26572](https://github.com/anthropics/claude-code/issues/26572)).
- #23615 "Agent teams should spawn in new tmux window, not split current pane". Open, 24 ([#23615](https://github.com/anthropics/claude-code/issues/23615)).
- #36926 "Support cmux as a teammateMode backend for agent teams". Open, 13 ([#36926](https://github.com/anthropics/claude-code/issues/36926)).
- #24385 "Agent team iTerm2 panes not closed on teammate shutdown". Open, 12 ([#24385](https://github.com/anthropics/claude-code/issues/24385)).
- Windows Terminal quality issues: #12234 "Claude Code freezes intermittently on Windows Terminal" (open, 19) ([#12234](https://github.com/anthropics/claude-code/issues/12234)); #8208 "/terminal-setup error message contradicts itself regarding Windows Terminal support" (closed, 59) ([#8208](https://github.com/anthropics/claude-code/issues/8208)).

**anthropics/claude-code: talking to and popping out individual agents**
- #24123 "Feature request: /fork should support opening in a new terminal tab". Open, 34, 2026-02-08. Use case: several "discussion rooms" sharing the same starting context ([#24123](https://github.com/anthropics/claude-code/issues/24123)).
- #24294 "[FEATURE] Allow existing Claude Code sessions to join a team as teammates". Closed **not planned**, 2026-03-23, 8 ([#24294](https://github.com/anthropics/claude-code/issues/24294)).
- #92183 "[BUG] Desktop app disallows SendMessage, so subagents cannot be messaged or resumed". Closed completed, 2026-09-15, 18 ([#92183](https://github.com/anthropics/claude-code/issues/92183)).
- #38183 "[BUG] SendMessage tool referenced but not available — agent continuation broken since resume parameter removal". Open, 32 ([#38183](https://github.com/anthropics/claude-code/issues/38183)).
- #35240 "Agent tool documentation references SendMessage for subagent resumption, but SendMessage is gated behind Agent Teams flag". Closed completed, 2026-07-01, 27 ([#35240](https://github.com/anthropics/claude-code/issues/35240)); also #42737 (closed, 9) ([#42737](https://github.com/anthropics/claude-code/issues/42737)).
- #23669 "Agent Teams: support per-teammate working directory, CLAUDE.md, and MCP configs". Open, 32 ([#23669](https://github.com/anthropics/claude-code/issues/23669)).
- #24316 "[FEATURE] Allow custom .claude/agents/ definitions as agent team teammates". Closed, 43; now supported per the docs ([#24316](https://github.com/anthropics/claude-code/issues/24316), [docs](https://code.claude.com/docs/en/agent-teams)).
- #12748 "[FEATURE] Add cwd parameter to Task tool for setting subagent working directory (to support Git worktrees)". Open, 28 ([#12748](https://github.com/anthropics/claude-code/issues/12748)).
- #12790 "[Feature Request] Subagents should inherit parent agent context to avoid redundant codebase scanning". Closed, 26 (Dec 2025) ([#12790](https://github.com/anthropics/claude-code/issues/12790)).
- #50246 "Feature Request: Message queue mode — queue messages instead of interrupting active tasks". Closed, 254 (214) ([#50246](https://github.com/anthropics/claude-code/issues/50246)).
- Background agents and attach (first-party, mid-2026): #73754 "Attaching to a stopped/idle background agent crashes the worker…" (closed, 15) ([#73754](https://github.com/anthropics/claude-code/issues/73754)); #74113 "Background agents frequently go idle without delivering their final SendMessage report" (closed, 8) ([#74113](https://github.com/anthropics/claude-code/issues/74113)); #63023 "Background agents silently die on session pause/resume…" (open, 5) ([#63023](https://github.com/anthropics/claude-code/issues/63023)).
- Team-messaging reliability: [#23415](https://github.com/anthropics/claude-code/issues/23415), [#34668](https://github.com/anthropics/claude-code/issues/34668), [#38932](https://github.com/anthropics/claude-code/issues/38932), [#47930](https://github.com/anthropics/claude-code/issues/47930) (details in Q3).
- Extensibility context: #91870 "Mods - make Claude 10x more extensible". Open, 224, Sept 2026 ([#91870](https://github.com/anthropics/claude-code/issues/91870)). This is the mod surface used by agentpane and similar tools.

**openai/codex**
- #22321 "Add an Agent View for managing multiple Codex agents from the TUI". Closed completed, 2026-09-09, 50, 16 comments. It asked for `/agents`, per-agent status, last-response preview and jumping into an agent session ([#22321](https://github.com/openai/codex/issues/22321)).
- #12047 "[UX/DX] Multi-agent TUI overhaul: named agents, per-agent config, async orchestration & @mention messaging". Closed completed, 2026-10-12, 16. It criticized UUID-laden subagent events in the TUI ([#12047](https://github.com/openai/codex/issues/12047)).
- #12862 "CLI: add --worktree and --tmux flags for one-command isolated sessions". Closed, 129 (113) ([#12862](https://github.com/openai/codex/issues/12862)).
- #10471 "Codex App: Add subagent monitoring to the UI". Closed, 14 ([#10471](https://github.com/openai/codex/issues/10471)).
- #32283 "Subagents panel no longer shows each agent's model or reasoning effort". Open, 20 ([#32283](https://github.com/openai/codex/issues/32283)).
- #32753 "Multi-agent V2 regression: subagent instructions are no longer observable". Closed, 11 ([#32753](https://github.com/openai/codex/issues/32753)).
- #15723 "Background subprocesses/subagents do not wake the calling agent on completion". Open, 13 ([#15723](https://github.com/openai/codex/issues/15723)).
- #24704 "Forked subagents lose prompt-cache lineage for inherited parent context". Open, 20 ([#24704](https://github.com/openai/codex/issues/24704)).
- #13004 "Let us set custom sub-agent names" (closed, 15) ([#13004](https://github.com/openai/codex/issues/13004)); #14039 "Allow per-subagent model/provider/profile selection" (closed, 21) ([#14039](https://github.com/openai/codex/issues/14039)); #2604 "Subagent Support" (2025, closed, 413) ([#2604](https://github.com/openai/codex/issues/2604)).
- #34268 "Multi-agent V2 full-history forks duplicate historical compaction snapshots and inline images, causing >100 GiB session storage growth". Closed, 7 ([#34268](https://github.com/openai/codex/issues/34268)).
- #44096 "[Windows App] Let the global pop-out shortcut open Chat mode and remember the selected mode". Open, 22. This shows the Codex Windows app has a pop-out window concept ([#44096](https://github.com/openai/codex/issues/44096)).
- #48500 "Managed app-server runs hooks with the first client's TMUX_PANE/TMUX, misattributing hook events to the wrong terminal pane (0.157 regression)". Open, 22 ([#48500](https://github.com/openai/codex/issues/48500)).
- #16717 "feat: configurable Windows agent shell (powershell/git-bash)". Closed, 44 ([#16717](https://github.com/openai/codex/issues/16717)).

### Inferences
- The pane-backend cluster (#24122, #24189, #31901, #24384, #23574, #26572, #36926; about 380 combined reactions) signals strong demand for terminal-agnostic teammate panes. Anthropic has not shipped it after 8+ months, and the Windows Terminal request (#24384) is still open. Community shims (cmux, psmux, zellij-claude-teams) fill the gap.
- Anthropic's rejection of "join existing sessions to a team" (#24294) leaves the post-hoc composition and promotion use case to third parties.

### Gaps
- Reaction counts for issues not listed were not exhaustively collected. Search was title-based plus a few phrase searches, so some relevant issues with unusual titles may be missed.
- No high-vote Codex issue specifically asking for Windows Terminal panes was found.

---

## Q6. Synthesis: recurring pain points, most-wished-for features, and the product opportunity for a Windows-first harness

### Takeaway
The unmet need, consistent across tools and trackers, is **persistent, named, addressable team members that are each a real interactive CLI session**: visible in their own Windows Terminal tab or pane, talkable mid-run without breaking the team protocol (mailbox and task list), with reliable "needs you" signals, and with context preserved across pop-out, fork and resume. cmux proved the terminal-primitive approach on macOS. psmux, wmux, Herdr and Runner prove pieces are possible on Windows. No one has combined them into a Windows-first product that also handles prompt-defined role teams and Korean IME correctly.

### Cited Findings
- Most-wished-for features with evidence:
  - Terminal-agnostic teammate panes, including Windows Terminal ([#24384](https://github.com/anthropics/claude-code/issues/24384), [#26572](https://github.com/anthropics/claude-code/issues/26572)).
  - Open a fork or session in a new tab ([#24123](https://github.com/anthropics/claude-code/issues/24123)).
  - Join existing sessions into a team ([#24294](https://github.com/anthropics/claude-code/issues/24294)).
  - An agent list with statuses and jump-in ([Codex #22321](https://github.com/openai/codex/issues/22321)).
  - Named agents and @mention messaging ([Codex #12047](https://github.com/openai/codex/issues/12047)).
  - Message queueing without interrupting ([#50246](https://github.com/anthropics/claude-code/issues/50246); agent-deck `o`/`Shift+Q` in [README](https://github.com/asheshgoplani/agent-deck)).
  - Per-teammate cwd, CLAUDE.md and MCP config ([#23669](https://github.com/anthropics/claude-code/issues/23669)).
  - Reliable needs-input detection ([cmux #1027](https://github.com/manaflow-ai/cmux/issues/1027)).
  - Live persistence across restarts ([cmux #480](https://github.com/manaflow-ai/cmux/issues/480), [#1663](https://github.com/manaflow-ai/cmux/issues/1663); Runner `runnerd` and Herdr's background server: [Runner](https://github.com/yicheng47/runner), [Herdr](https://github.com/herdrdev/herdr)).
  - Linux and Windows parity ([cmux #330](https://github.com/manaflow-ai/cmux/issues/330), [#1012](https://github.com/manaflow-ai/cmux/issues/1012)).
  - Remote and mobile steering of a specific session ([Happy](https://github.com/slopus/happy), [wmux Fleet](https://github.com/openwong2kim/wmux), [Paseo](https://github.com/getpaseo/paseo)).
  - Per-agent cost and limits visibility ([abtop](https://github.com/graykode/abtop); [Maestro](https://github.com/RunMaestro/Maestro)).
- Windows building blocks that exist today: psmux gives native tmux semantics and makes Claude teammates appear as panes ([docs](https://github.com/psmux/psmux/blob/HEAD/docs/claude-code.md)). Herdr provides a native ConPTY runtime and agent-to-agent prompting, with Korean IME caveats ([docs](https://herdr.dev/docs/windows-beta/)). The wmux projects provide attention routing, a named-pipe API and a2a `send_message` ([amirlehmam](https://github.com/amirlehmam/wmux), [openwong2kim](https://github.com/openwong2kim/wmux)). Runner provides crews, missions and per-slot real TUIs ([README](https://github.com/yicheng47/runner)).

### Inferences: product opportunities (for the user's harness)
1. **"Pop-out" as a first-class verb**: one command (e.g., `harness pop researcher-2`) opens that member in a new Windows Terminal tab or split via `wt.exe`, attached to the same live process or session, with the member still registered in the team mailbox. No surveyed tool offers this post-hoc on Windows Terminal. The current options are spawn-time panes (psmux/cmux) or forks that leave the team.
2. **Own the spawn**: launch every role (PM, researchers, synthesizer) as a separate `claude` or `codex` process the harness tracks, instead of relying on in-session subagents. Claude's model may otherwise pick invisible worktree subagents, which psmux documents as un-poppable on Windows.
3. **Mailbox + human channel parity**: messages from the human to any member and member-to-member messages go through the same addressable mailbox (as in Claude teams, Gas Town and wmux `send_message`). Include queue-don't-interrupt semantics (agent-deck) and a lead/synthesizer that sees human side-conversations, so the final synthesis reflects them.
4. **Reliable attention routing**: base status on vendor hooks plus explicit protocol events rather than screen-scraping. Flakiness is cmux's most-reacted bug class. Present a Fleet or Agent-View style "needs you" list.
5. **Context continuity primitives**: fork-with-transcript (ccmanager/agent-deck style), structured handoff documents, and re-register-as-member after fork. This directly addresses the declined #24294 and the HN compaction complaints.
6. **Windows and Korean polish as a moat**: ConPTY-native, Windows Terminal integration (tabs and panes, toasts, taskbar flash), PowerShell 7 awareness (psmux's requirement), and **tested Korean IME** (Herdr flags only partial support).
7. **Simplicity over ontology**: avoid Gas Town-style role zoos and cmux-style settings sprawl. Use an open, file-based team state (JSON mailboxes and task lists like Claude's `~/.claude/teams`) so users aren't locked in. This also hedges against tool mortality and vendor billing-policy risk ([Paseo #1029](https://github.com/getpaseo/paseo/issues/1029)).
8. **Cost guardrails**: per-member token and limit meters and concurrency caps, like Gas Town's scheduler and wmux's limit-pause, because parallel teams burn quotas quickly ([HN](https://news.ycombinator.com/item?id=47221592)).

### Gaps
- No hands-on validation of the Windows tools (psmux + Claude teams, Herdr on Windows with Korean IME, Runner alpha, wmux a2a). These should be prototyped before design commitments.
- Whether `wt.exe` can re-host an already running ConPTY session (true live "move to new tab") rather than starting a resumed session was not researched. It is likely impossible without a broker process holding the PTY (as Herdr, runnerd and psmux servers do), so a broker/daemon architecture is probably required. This is an inference, not verified.
