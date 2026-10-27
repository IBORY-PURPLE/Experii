import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";
import { ROUTINE_ID } from "../ids.ts";

export const FireRoutine = DefineFunction({
  callback_id: "fire_routine",
  title: "Chief of Staff 루틴 호출",
  source_file: "functions/fire_routine.ts",
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
  output_parameters: { properties: {}, required: [] },
});

export default SlackFunction(FireRoutine, async ({ inputs, env, client }) => {
  const text = [
    `slack ${inputs.event}`,
    `channel=${inputs.channel_id}`,
    `ts=${inputs.message_ts}`,
    `thread_ts=${inputs.thread_ts || "-"}`,
    `user=${inputs.user_id}`,
    `reaction=${inputs.reaction || "-"}`,
  ].join(" ");

  let failure = "";
  try {
    const res = await fetch(
      `https://api.anthropic.com/v1/claude_code/routines/${ROUTINE_ID}/fire`,
      {
        method: "POST",
        headers: {
          "authorization": `Bearer ${env.ROUTINE_TOKEN}`,
          "anthropic-beta": "experimental-cc-routine-2026-04-01",
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({ text }),
      },
    );
    if (!res.ok) failure = `${res.status} ${(await res.text()).slice(0, 300)}`;
  } catch (e) {
    failure = String(e);
  }

  // ⏳ tells the founder on the phone that the run was started; ⚠️ that it was not.
  await client.reactions.add({
    channel: inputs.channel_id,
    timestamp: inputs.message_ts,
    name: failure ? "warning" : "hourglass_flowing_sand",
  });

  if (failure) return { error: `routine fire failed: ${failure}` };
  return { outputs: {} };
});
