import { WSClient } from "@wecom/aibot-node-sdk";
import { AgentClient, OpenAICompatibleClient } from "./agent-client.js";
import { createBridge } from "./bridge.js";
import { readConfig, validateRuntimeConfig } from "./config.js";
import { loadEnvFile } from "./env-file.js";
import { createLogger } from "./logger.js";

loadEnvFile();

const logger = createLogger();
const config = readConfig();

validateRuntimeConfig(config);

const wsClient = new WSClient({
  botId: config.wecom.botId,
  secret: config.wecom.secret,
  wsUrl: config.wecom.wsUrl,
  maxReconnectAttempts: config.wecom.maxReconnectAttempts,
  logger,
});

const agentClient =
  config.mode === "openai-compatible"
    ? new OpenAICompatibleClient(config.llm)
    : new AgentClient(config.agent);

createBridge({ wsClient, agentClient, config, logger }).attach();

wsClient.connect();

// Keep the bridge process alive even if the SDK has no ref'ed timers after auth.
const keepAliveTimer = setInterval(() => {}, 60_000);

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  logger.info("shutdown_requested");
  clearInterval(keepAliveTimer);
  wsClient.disconnect();
  process.exit(0);
}
