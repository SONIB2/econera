import assert from "node:assert/strict";
import test from "node:test";
import { aiBudgetExceeded, aiCaps } from "../lib/rate-limit";

test("AI spending guard: kill switch, daily cap, then monthly cap", async (t) => {
  const keys = ["AI_DISABLED", "AI_DAILY_LIMIT_DESIGN", "AI_MONTHLY_LIMIT_DESIGN", "AI_DAILY_LIMIT_ROOM", "AI_MONTHLY_LIMIT_ROOM", "UPSTASH_REDIS_REST_URL"];
  const prev = keys.map((k) => process.env[k]);
  t.after(() => keys.forEach((k, i) => (prev[i] === undefined ? delete process.env[k] : (process.env[k] = prev[i]))));
  delete process.env.UPSTASH_REDIS_REST_URL;

  process.env.AI_DISABLED = "1";
  assert.equal(await aiBudgetExceeded("voice"), true, "kill switch stops every feature");
  delete process.env.AI_DISABLED;

  process.env.AI_DAILY_LIMIT_DESIGN = "3";
  process.env.AI_MONTHLY_LIMIT_DESIGN = "100";
  const day = [];
  for (let i = 0; i < 4; i++) day.push(await aiBudgetExceeded("design"));
  assert.deepEqual(day, [false, false, false, true], "fourth call of the day is refused");

  process.env.AI_DAILY_LIMIT_ROOM = "100";
  process.env.AI_MONTHLY_LIMIT_ROOM = "2";
  const month = [];
  for (let i = 0; i < 3; i++) month.push(await aiBudgetExceeded("room"));
  assert.deepEqual(month, [false, false, true], "monthly cap applies even under the daily cap");

  assert.deepEqual(aiCaps().room, { day: 100, month: 2 });
  assert.deepEqual(aiCaps().voice, { day: 3000, month: 30000 });
});
