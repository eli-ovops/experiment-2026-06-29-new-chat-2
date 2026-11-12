import { EventEmitter } from "node:events";
import { createBridge } from "../src/bridge.js";
import { readConfig } from "../src/config.js";
import { createLogger } from "../src/logger.js";

class MockWsClient extends EventEmitter {
  constructor() {
    super();
    this.replies = [];
  }

  async replyStream(frame, streamId, content, finish) {
    const reply = {
      reqId: frame.headers.req_id,
      streamId,
      content,
      finish,
    };
    this.replies.push(reply);
    console.log(JSON.stringify(reply, null, 2));
    return reply;
  }
}

const wsClient = new MockWsClient();
const agentClient = {
  async ask(message) {
    return `Agent mock reply: ${message.text}`;
  },
};

const config = readConfig({
  ALLOWED_CHAT_IDS: "CHATID",
  ALLOWED_USER_IDS: "USERID",
});

const logger = createLogger({
  info: (...args) => console.log("[info]", ...args),
  warn: (...args) => console.warn("[warn]", ...args),
  error: (...args) => console.error("[error]", ...args),
  debug: (...args) => console.debug("[debug]", ...args),
});

const bridge = createBridge({
  wsClient,
  agentClient,
  config,
  logger,
  createStreamId: () => "stream_mock_1",
});

await bridge.handleTextFrame({
  cmd: "aibot_msg_callback",
  headers: { req_id: "REQID" },
  body: {
    msgid: "MSGID",
    aibotid: "AIBOTID",
    chatid: "CHATID",
    chattype: "group",
    from: { userid: "USERID" },
    msgtype: "text",
    text: { content: "@ovops-bot hello" },
  },
});
