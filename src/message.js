export function extractTextMessage(frame) {
  const body = frame?.body;
  if (!body) return { ok: false, reason: "missing_body" };
  if (body.chattype !== "group" && body.chattype !== "single") {
    return { ok: false, reason: "unsupported_chat_type" };
  }
  if (body.msgtype !== "text") return { ok: false, reason: "not_text" };
  if (!body.msgid) return { ok: false, reason: "missing_msgid" };
  if (body.chattype === "group" && !body.chatid) return { ok: false, reason: "missing_chatid" };

  const rawContent = body.text?.content;
  if (typeof rawContent !== "string" || rawContent.trim() === "") {
    return { ok: false, reason: "empty_text" };
  }

  return {
    ok: true,
    message: {
      msgid: body.msgid,
      chatid: body.chatid ?? body.from?.userid,
      chattype: body.chattype,
      userid: body.from?.userid,
      rawText: rawContent,
      text: stripLeadingMention(rawContent),
    },
  };
}

export const extractGroupTextMessage = extractTextMessage;

export function stripLeadingMention(content) {
  return content.replace(/^@\S+\s*/u, "").trim();
}

export function truncateForWeCom(content, maxBytes = 20_000) {
  const text = String(content || "").trim();
  if (Buffer.byteLength(text, "utf8") <= maxBytes) return text;

  let output = "";
  for (const char of text) {
    const next = output + char;
    if (Buffer.byteLength(next, "utf8") > maxBytes - 30) break;
    output = next;
  }
  return `${output}\n\n[内容过长，已截断]`;
}
