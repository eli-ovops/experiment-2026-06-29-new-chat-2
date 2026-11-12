import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createBridge } from "../src/bridge.js";
import { readConfig } from "../src/config.js";

class FakeWsClient extends EventEmitter {
  constructor() {
    super();
    this.replies = [];
  }

  async replyStream(frame, streamId, content, finish) {
    this.replies.push({ frame, streamId, content, finish });
  }
}

const silentLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

function makeFrame(overrides = {}) {
  return {
    cmd: "aibot_msg_callback",
    headers: { req_id: "r1" },
    body: {
      msgid: "m1",
      aibotid: "bot1",
      chatid: "c1",
      chattype: "group",
      from: { userid: "u1" },
      msgtype: "text",
      text: { content: "@bot ping" },
      ...overrides,
    },
  };
}

test("bridge sends processing and final text replies", async () => {
  const wsClient = new FakeWsClient();
  const bridge = createBridge({
    wsClient,
    agentClient: { ask: async () => "pong" },
    config: readConfig({}),
    logger: silentLogger,
    createStreamId: () => "stream1",
  });

  await bridge.handleTextFrame(makeFrame());

  assert.equal(wsClient.replies.length, 2);
  assert.equal(wsClient.replies[0].content, "收到，正在处理。");
  assert.equal(wsClient.replies[0].finish, false);
  assert.equal(wsClient.replies[1].content, "pong");
  assert.equal(wsClient.replies[1].finish, true);
});

test("bridge deduplicates msgid", async () => {
  const wsClient = new FakeWsClient();
  let agentCalls = 0;
  const bridge = createBridge({
    wsClient,
    agentClient: {
      ask: async () => {
        agentCalls += 1;
        return "pong";
      },
    },
    config: readConfig({}),
    logger: silentLogger,
    createStreamId: () => "stream1",
  });

  await bridge.handleTextFrame(makeFrame());
  await bridge.handleTextFrame(makeFrame());

  assert.equal(agentCalls, 1);
  assert.equal(wsClient.replies.length, 2);
});

test("bridge returns safe error text when agent fails", async () => {
  const wsClient = new FakeWsClient();
  const bridge = createBridge({
    wsClient,
    agentClient: {
      ask: async () => {
        throw new Error("agent down");
      },
    },
    config: readConfig({}),
    logger: silentLogger,
    createStreamId: () => "stream1",
  });

  await bridge.handleTextFrame(makeFrame());

  assert.equal(wsClient.replies.length, 2);
  assert.match(wsClient.replies[1].content, /处理失败/);
  assert.equal(wsClient.replies[1].finish, true);
});

test("bridge rejects messages outside configured chat allowlist", async () => {
  const wsClient = new FakeWsClient();
  const bridge = createBridge({
    wsClient,
    agentClient: { ask: async () => "pong" },
    config: readConfig({ ALLOWED_CHAT_IDS: "other-chat" }),
    logger: silentLogger,
    createStreamId: () => "stream1",
  });

  await bridge.handleTextFrame(makeFrame());

  assert.equal(wsClient.replies.length, 1);
  assert.match(wsClient.replies[0].content, /暂未对当前会话开放/);
});
