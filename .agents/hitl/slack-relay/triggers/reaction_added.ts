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
  name: "인입 채널에 창업자 ✅·❌",
  workflow: `#/workflows/${RelayToChief.definition.callback_id}`,
  event: {
    event_type: TriggerEventTypes.ReactionAdded,
    channel_ids: [INBOX_CHANNEL_ID],
    filter: {
      version: 1,
      root: {
        operator: "AND",
        inputs: [
          { statement: `{{data.user_id}} == ${FOUNDER_ID}` },
          {
            operator: "OR",
            inputs: [
              { statement: "{{data.reaction}} == white_check_mark" },
              { statement: "{{data.reaction}} == x" },
            ],
          },
        ],
      },
    },
  },
  inputs: {
    event: { value: "reaction_added" },
    channel_id: { value: TriggerContextData.Event.ReactionAdded.channel_id },
    message_ts: { value: TriggerContextData.Event.ReactionAdded.message_ts },
    user_id: { value: TriggerContextData.Event.ReactionAdded.user_id },
    reaction: { value: TriggerContextData.Event.ReactionAdded.reaction },
  },
};

export default trigger;
