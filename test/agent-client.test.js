import test from "node:test";
import assert from "node:assert/strict";
import { AgentClient, OpenAICompatibleClient } from "../src/agent-client.js";

test("AgentClient posts message and extracts reply", async () => {
  const calls = [];
  const client = new AgentClient({
    endpoint: "https://agent.example.test/chat",
    apiKey: "secret",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({ reply: "pong" });
    },
  });

  const reply = await client.ask({
    text: "ping",
    msgid: "m1",
    chatid: "c1",
    chattype: "group",
    userid: "u1",
  });

  assert.equal(reply, "pong");
  assert.equal(calls[0].url, "https://agent.example.test/chat");
  assert.equal(calls[0].options.headers.authorization, "Bearer secret");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    message: "ping",
    metadata: {
      msgid: "m1",
      chatid: "c1",
      chattype: "group",
      userid: "u1",
    },
  });
});

test("AgentClient rejects empty agent replies", async () => {
  const client = new AgentClient({
    endpoint: "https://agent.example.test/chat",
    apiKey: "secret",
    fetchImpl: async () => Response.json({ reply: "" }),
  });

  await assert.rejects(
    () =>
      client.ask({
        text: "ping",
        msgid: "m1",
        chatid: "c1",
        chattype: "group",
        userid: "u1",
      }),
    /did not include/,
  );
});

test("OpenAICompatibleClient posts chat completions request and extracts message content", async () => {
  const calls = [];
  const client = new OpenAICompatibleClient({
    baseUrl: "https://llm.example.test/v1/chat/completions",
    apiKey: "secret",
    model: "model-a",
    systemPrompt: "system",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return Response.json({
        choices: [{ message: { content: "pong" } }],
      });
    },
  });

  const reply = await client.ask({
    text: "ping",
    msgid: "m1",
    chatid: "c1",
    chattype: "group",
    userid: "u1",
  });

  assert.equal(reply, "pong");
  assert.equal(calls[0].url, "https://llm.example.test/v1/chat/completions");
  assert.equal(calls[0].options.headers.authorization, "Bearer secret");
  assert.deepEqual(JSON.parse(calls[0].options.body), {
    model: "model-a",
    messages: [
      { role: "system", content: "system" },
      { role: "user", content: "ping" },
    ],
    stream: false,
  });
});
