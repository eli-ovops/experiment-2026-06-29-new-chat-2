const DEFAULT_AGENT_TIMEOUT_MS = 25_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

export function parseCsv(value) {
  if (!value) return new Set();
  return new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function readConfig(env = process.env) {
  const mode = env.BRIDGE_MODE || (env.LLM_BASE_URL ? "openai-compatible" : "agent");
  return {
    mode,
    wecom: {
      botId: env.WECOM_BOT_ID,
      secret: env.WECOM_BOT_SECRET,
      wsUrl: env.WECOM_WS_URL || "wss://openws.work.weixin.qq.com",
      maxReconnectAttempts: Number(env.WECOM_MAX_RECONNECT_ATTEMPTS || DEFAULT_MAX_RECONNECT_ATTEMPTS),
    },
    agent: {
      endpoint: env.AGENT_ENDPOINT,
      apiKey: env.AGENT_API_KEY,
      timeoutMs: Number(env.AGENT_TIMEOUT_MS || DEFAULT_AGENT_TIMEOUT_MS),
    },
    llm: {
      baseUrl: env.LLM_BASE_URL,
      apiKey: env.LLM_API_KEY,
      model: env.LLM_MODEL,
      systemPrompt:
        env.LLM_SYSTEM_PROMPT ||
        "你是企业微信群里的智能助手。直接回答用户问题，不展示思考过程。回答要简洁、准确、适合在企业微信群内发送。",
      timeoutMs: Number(env.LLM_TIMEOUT_MS || env.AGENT_TIMEOUT_MS || DEFAULT_AGENT_TIMEOUT_MS),
    },
    access: {
      allowedChatIds: parseCsv(env.ALLOWED_CHAT_IDS),
      allowedUserIds: parseCsv(env.ALLOWED_USER_IDS),
    },
  };
}

export function validateRuntimeConfig(config) {
  const missing = [];
  if (!config.wecom.botId) missing.push("WECOM_BOT_ID");
  if (!config.wecom.secret) missing.push("WECOM_BOT_SECRET");
  if (config.mode === "agent") {
    if (!config.agent.endpoint) missing.push("AGENT_ENDPOINT");
    if (!config.agent.apiKey) missing.push("AGENT_API_KEY");
  } else if (config.mode === "openai-compatible") {
    if (!config.llm.baseUrl) missing.push("LLM_BASE_URL");
    if (!config.llm.apiKey) missing.push("LLM_API_KEY");
    if (!config.llm.model) missing.push("LLM_MODEL");
  } else {
    throw new Error("BRIDGE_MODE must be agent or openai-compatible");
  }
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const timeoutMs = config.mode === "agent" ? config.agent.timeoutMs : config.llm.timeoutMs;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000) {
    throw new Error("Timeout must be a number >= 1000");
  }
  if (!Number.isFinite(config.wecom.maxReconnectAttempts)) {
    throw new Error("WECOM_MAX_RECONNECT_ATTEMPTS must be a number");
  }
}
