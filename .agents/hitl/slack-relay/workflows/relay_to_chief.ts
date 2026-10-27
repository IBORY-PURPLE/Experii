import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { FireRoutine } from "../functions/fire_routine.ts";

const RelayToChief = DefineWorkflow({
  callback_id: "relay_to_chief",
  title: "Chief of Staff 바로 실행",
  input_parameters: {
    properties: {
      event: { type: Schema.types.string },
      channel_id: { type: Schema.slack.types.channel_id },
      message_ts: { type: Schema.types.string },
      thread_ts: { type: Schema.types.string },
      user_id: { type: Schema.slack.types.user_id },
      reaction: { type: Schema.types.string },
    },
    required: ["event", "channel_id", "message_ts", "user_id"],
  },
});

RelayToChief.addStep(FireRoutine, {
  event: RelayToChief.inputs.event,
  channel_id: RelayToChief.inputs.channel_id,
  message_ts: RelayToChief.inputs.message_ts,
  thread_ts: RelayToChief.inputs.thread_ts,
  user_id: RelayToChief.inputs.user_id,
  reaction: RelayToChief.inputs.reaction,
});

export default RelayToChief;
