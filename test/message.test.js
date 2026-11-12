import test from "node:test";
import assert from "node:assert/strict";
import { extractTextMessage, stripLeadingMention, truncateForWeCom } from "../src/message.js";

test("stripLeadingMention removes the leading WeCom bot mention", () => {
  assert.equal(stripLeadingMention("@ovops-bot hello robot"), "hello robot");
});

test("extractTextMessage returns a normalized group text message", () => {
  const parsed = extractTextMessage({
    body: {
      msgid: "m1",
      chatid: "c1",
      chattype: "group",
      from: { userid: "u1" },
      msgtype: "text",
      text: { content: "@bot ping" },
    },
  });

  assert.equal(parsed.ok, true);
  assert.equal(parsed.message.text, "ping");
  assert.equal(parsed.message.msgid, "m1");
});

test("extractTextMessage accepts single chat", () => {
  const parsed = extractTextMessage({
    body: {
      msgid: "m1",
      chattype: "single",
      from: { userid: "u1" },
      msgtype: "text",
      text: { content: "ping" },
    },
  });

  assert.equal(parsed.ok, true);
  assert.equal(parsed.message.chatid, "u1");
  assert.equal(parsed.message.text, "ping");
});

test("truncateForWeCom keeps output inside byte budget", () => {
  const truncated = truncateForWeCom("你".repeat(100), 60);
  assert.ok(Buffer.byteLength(truncated, "utf8") <= 90);
  assert.match(truncated, /已截断/);
});
