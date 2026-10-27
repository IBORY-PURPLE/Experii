import { Manifest } from "deno-slack-sdk/mod.ts";
import RelayToChief from "./workflows/relay_to_chief.ts";

export default Manifest({
  name: "Experii Relay",
  description: "#experii-inbox에 창업자 글이나 ✅·❌가 올라오면 Chief of Staff 루틴을 바로 실행한다",
  icon: "assets/icon.png",
  workflows: [RelayToChief],
  outgoingDomains: ["api.anthropic.com"],
  botScopes: [
    "channels:history",
    "groups:history",
    "im:read",
    "mpim:read",
    "reactions:read",
    "reactions:write",
  ],
});
