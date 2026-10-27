# 폰 채널 설정 (HITL)

에이전트가 창업자에게 묻고 승인받는 채널의 좌표다. 비밀값은 여기 두지 않는다. 봇 토큰은 클라우드 환경 `experii`의 네트워크 비밀값(호스트 `slack.com`, `Authorization: Bearer`)에만 있다. 규약 전체는 `.agents/plan.md`의 "폰 채널 (HITL) 규약"을 따른다.

| 항목 | 값 |
|---|---|
| 채널 종류 | Slack (2026-10-27 확정: 관리자 승인 없이 봇 설치됨) |
| 워크스페이스 | Gachon Cocone School (`1000school.slack.com`, 팀 ID `T05PSHR1TB4`) |
| 봇 앱 | Experii Bot (앱 ID `A0CCLMWSUAY`, 표시 이름 `experii-bot`), 매니페스트 `.agents/hitl/slack-manifest.yaml` |
| 인입 채널 | `#experii-inbox` (비공개), 채널 ID `TODO` |
| 운영 채널 | `#experii-ops` (비공개), 채널 ID `TODO` |
| 창업자 멤버 ID | `TODO` (승인 ✅는 이 ID가 단 것만 인정) |

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
