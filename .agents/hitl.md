# 폰 채널 설정 (HITL)

에이전트가 창업자에게 묻고 승인받는 채널의 좌표다. 비밀값은 여기 두지 않는다. 봇 토큰은 클라우드 환경 `experii`의 네트워크 비밀값(호스트 `slack.com`, `Authorization: Bearer`)에만 있다. 규약 전체는 `.agents/plan.md`의 "폰 채널 (HITL) 규약"을 따른다.

| 항목 | 값 |
|---|---|
| 채널 종류 | Slack (2026-10-27 확정: 관리자 승인 없이 봇 설치됨) |
| 워크스페이스 | Gachon Cocone School (`1000school.slack.com`, 팀 ID `T05PSHR1TB4`) |
| 봇 앱 | Experii Bot (앱 ID `A0CCLMWSUAY`, 봇 사용자 `U0CCGRR53GA`, 표시 이름 `experii-bot`), 매니페스트 `.agents/hitl/slack-manifest.yaml` |
| 인입 채널 | `#experii-inbox` (비공개), 채널 ID `C0CDCA54HEU` |
| 운영 채널 | `#experii-ops` (비공개), 채널 ID `C0CCMKW1MJ8` |
| 창업자 멤버 ID | `U0AHC70B249` (승인 ✅는 이 ID가 단 것만 인정) |
| 바로 실행 중계 | Experii Relay (앱 ID `A0CCCGHSG59`, 트리거 글 `Ft0CCCGQ124B`·✅❌ `Ft0CCGQN7SH4`), `.agents/hitl/slack-relay/` (아래) |

## 봇이 쓰는 Slack API

| 하는 일 | API | 권한 |
|---|---|---|
| 글·스레드 답 쓰기 | `chat.postMessage` (`thread_ts`로 스레드 답) | `chat:write` |
| 인입 글 읽기 | `conversations.history`, `conversations.replies` | `groups:history` (비공개), `channels:history` |
| 채널 찾기 | `conversations.list` | `groups:read`, `channels:read` |
| 승인 ✅ 읽기 | `reactions.get` | `reactions:read` |

호출 예 (클라우드 세션, 토큰은 프록시가 붙인다):

```bash
curl -s https://slack.com/api/chat.postMessage \
  -H 'Content-Type: application/json; charset=utf-8' \
  -d '{"channel":"<인입 채널 ID>","thread_ts":"<원글 ts>","text":"[cos:brief SON-12] ..."}'
```

## 바로 실행 중계 (Experii Relay)

인입 채널에 창업자 글·답글이나 창업자의 ✅·❌가 올라오면 Chief of Staff 루틴을 바로 띄우는 Slack 워크플로 앱이다. Slack이 호스팅하는 Deno 앱이라 노트북이 꺼져 있어도 돈다.

- 반응: 루틴을 띄우면 그 글에 ⏳, 띄우지 못하면 ⚠️를 단다. Chief of Staff가 끝나면 스레드에 표식 답이 달린다.
- 토큰: 루틴 API 토큰은 이 앱의 환경 변수 `ROUTINE_TOKEN`에만 있다. claude.ai 루틴 화면에서 토큰을 새로 만들면 `slackcli env set ROUTINE_TOKEN`으로 바꾼다.
- 한도: 루틴 하나에 API 실행은 시간당 30회다. 넘으면 ⚠️가 붙고, 다음 날 9시 7분 예약 실행이 놓친 글을 처리한다.
- 채널·창업자·루틴 ID는 `slack-relay/ids.ts`에 있다.

설치와 변경은 Windows에서 `slack-relay/` 폴더에서 한다. 이 PC에서는 `slack`이 Slack 데스크톱 앱이라 CLI를 `slackcli`로 설치했다.

```powershell
slackcli login                # Slack에 /slackauthticket 명령을 붙여 넣는다
slackcli deploy               # 코드나 매니페스트를 바꾼 뒤에도 같다
slackcli env set ROUTINE_TOKEN   # 값은 프롬프트에 붙여 넣는다
slackcli trigger create --trigger-def triggers/message_posted.ts
slackcli trigger create --trigger-def triggers/reaction_added.ts
slackcli activity --tail      # 실행 로그
```

`#experii-inbox`에 `/invite @Experii Relay`로 앱을 초대해야 이벤트를 받는다. `ids.ts`나 트리거 파일을 바꾸면 deploy 뒤 `slackcli trigger update`로 트리거도 고친다.
