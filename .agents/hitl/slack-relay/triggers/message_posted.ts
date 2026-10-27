import type { Trigger } from "deno-slack-sdk/types.ts";
import {
  TriggerContextData,
  TriggerEventTypes,
  TriggerTypes,
} from "deno-slack-api/mod.ts";
import RelayToChief from "../workflows/relay_to_chief.ts";
import { FOUNDER_ID, INBOX_CHANNEL_ID } from "../ids.ts";

const trigger: Trigger<typeof RelayToChief.definition> = {
  type: TriggerTypes.Event,
  name: "인입 채널에 창업자 글",
  workflow: `#/workflows/${RelayToChief.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.MessagePosted,
    channel_ids: [INBOX_CHANNEL_ID],
    filter: {
      version: 1,
      root: { statement: `{{data.user_id}} == ${FOUNDER_ID}` },
    },
  },
  inputs: {
    event: { value: "message_posted" },
    channel_id: { value: TriggerContextData.Event.MessagePosted.channel_id },
    message_ts: { value: TriggerContextData.Event.MessagePosted.message_ts },
    thread_ts: { value: TriggerContextData.Event.MessagePosted.thread_ts },
    user_id: { value: TriggerContextData.Event.MessagePosted.user_id },
  },
};

export default trigger;
