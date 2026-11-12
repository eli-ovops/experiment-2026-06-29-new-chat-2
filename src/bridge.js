import { generateReqId } from "@wecom/aibot-node-sdk";
import { isAllowed } from "./access.js";
import { DedupeStore } from "./dedupe.js";
import { extractTextMessage, truncateForWeCom } from "./message.js";

const PROCESSING_TEXT = "收到，正在处理。";
const NOT_ALLOWED_TEXT = "此机器人暂未对当前会话开放。";
const SAFE_ERROR_TEXT = "抱歉，当前机器人处理失败，请稍后再试或联系管理员。";

export function createBridge({
  wsClient,
  agentClient,
  config,
  logger,
  dedupeStore = new DedupeStore(),
  createStreamId = () => generateReqId("agent"),
}) {
  async function handleTextFrame(frame) {
    const parsed = extractTextMessage(frame);
    if (!parsed.ok) {
      logger.info("ignored_text_frame", { reason: parsed.reason });
      return;
    }

    const { message } = parsed;
    if (dedupeStore.hasSeen(message.msgid)) {
      logger.info("duplicate_message_ignored", {
        msgid: message.msgid,
        chatid: message.chatid,
      });
      return;
    }

    if (!isAllowed(message, config.access)) {
      logger.warn("message_rejected_by_access_rule", {
        msgid: message.msgid,
        chatid: message.chatid,
        userid: message.userid,
      });
      await replyText(frame, createStreamId(), NOT_ALLOWED_TEXT);
      return;
    }

    const streamId = createStreamId();
    logger.info("message_received", {
      msgid: message.msgid,
      chatid: message.chatid,
      userid: message.userid,
      contentLength: message.text.length,
    });

    try {
      await replyText(frame, streamId, PROCESSING_TEXT, false);
      const agentReply = await agentClient.ask(message);
      await replyText(frame, streamId, truncateForWeCom(agentReply), true);
      logger.info("message_replied", {
        msgid: message.msgid,
        chatid: message.chatid,
      });
    } catch (error) {
      logger.error("message_processing_failed", {
        msgid: message.msgid,
        chatid: message.chatid,
        error: error.message,
      });
      await replyText(frame, streamId, SAFE_ERROR_TEXT, true);
    }
  }

  function attach() {
    wsClient.on("authenticated", () => {
      logger.info("wecom_authenticated");
    });
    wsClient.on("connected", () => {
      logger.info("wecom_connected");
    });
    wsClient.on("disconnected", (reason) => {
      logger.warn("wecom_disconnected", { reason });
    });
    wsClient.on("reconnecting", (attempt) => {
      logger.warn("wecom_reconnecting", { attempt });
    });
    wsClient.on("error", (error) => {
      logger.error("wecom_client_error", { error: error.message });
    });
    wsClient.on("message.text", handleTextFrame);
    return wsClient;
  }

  async function replyText(frame, streamId, content, finish = true) {
    return wsClient.replyStream(frame, streamId, content, finish);
  }

  return {
    attach,
    handleTextFrame,
  };
}
