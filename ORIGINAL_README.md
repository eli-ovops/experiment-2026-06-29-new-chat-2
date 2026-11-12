# WeCom Bot Agent Bridge

Minimal bridge for an Enterprise WeChat intelligent bot in WebSocket long-connection mode.

Flow:

```text
Enterprise WeChat group @bot
-> WeCom intelligent bot long connection
-> this bridge
-> DeepSeek/GLM/OpenAI-compatible endpoint or your own Agent endpoint
-> text reply back to the group
```

## Safety Boundary

- No secrets are committed.
- Real credentials must be supplied through environment variables.
- The bridge only handles group text messages.
- No proactive push, file handling, image handling, scheduler, or production deployment is included.
- Logs avoid message content and secret values.

## Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` locally, or export the variables from your process manager:

```bash
export WECOM_BOT_ID="..."
export WECOM_BOT_SECRET="..."
export BRIDGE_MODE="openai-compatible"
export LLM_BASE_URL="https://your-provider.example.com/v1/chat/completions"
export LLM_MODEL="your-model-name"
export LLM_API_KEY="..."
```

Alternative Agent gateway mode:

```bash
export BRIDGE_MODE="agent"
export AGENT_ENDPOINT="https://your-agent.example.com/chat"
export AGENT_API_KEY="..."
```

In `openai-compatible` mode, the endpoint should follow the standard chat completions request and response shape:

```json
{
  "model": "your-model-name",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "user text" }
  ],
  "stream": false
}
```

The bridge reads:

```json
{
  "choices": [
    { "message": { "content": "text" } }
  ]
}
```

In `agent` mode, the Agent endpoint should accept:

```json
{
  "message": "user text",
  "metadata": {
    "msgid": "MSGID",
    "chatid": "CHATID",
    "chattype": "group",
    "userid": "USERID"
  }
}
```

It should return one of:

```json
{ "reply": "text" }
```

```json
{ "text": "text" }
```

```json
{ "message": "text" }
```

## Local Validation

```bash
npm test
npm run mock:once
```

`mock:once` does not connect to WeCom or any real Agent. It simulates one group text callback and prints the mocked reply.

## Run

Only run this after the risk checklist is accepted:

```bash
npm start
```

## Real Group Test Checklist

- `WECOM_BOT_ID`, `WECOM_BOT_SECRET`, and model/API keys are stored outside code.
- The robot is configured for WebSocket long connection mode.
- Only one live bridge process is running for this robot.
- `ALLOWED_CHAT_IDS` or `ALLOWED_USER_IDS` is configured before wider testing.
- Agent endpoint has timeout, rate limit, and content policy boundaries.
- Logs do not include full user message content or secrets.
- A manual stop path exists for the process.
- The first test is in a small internal group using `@机器人 测试`.

## Official References

- WeCom intelligent bot receive messages: https://developer.work.weixin.qq.com/document/path/100719
- WeCom intelligent bot long connection: https://developer.work.weixin.qq.com/document/path/101463
