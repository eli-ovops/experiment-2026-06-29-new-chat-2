export class AgentClient {
  constructor({ endpoint, apiKey, timeoutMs = 25_000, fetchImpl = fetch }) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async ask(message) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          message: message.text,
          metadata: {
            msgid: message.msgid,
            chatid: message.chatid,
            chattype: message.chattype,
            userid: message.userid,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Agent request failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply ?? data.text ?? data.message;
      if (typeof reply !== "string" || reply.trim() === "") {
        throw new Error("Agent response did not include reply/text/message");
      }

      return reply;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class OpenAICompatibleClient {
  constructor({ baseUrl, apiKey, model, systemPrompt, timeoutMs = 25_000, fetchImpl = fetch }) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.model = model;
    this.systemPrompt = systemPrompt;
    this.timeoutMs = timeoutMs;
    this.fetchImpl = fetchImpl;
  }

  async ask(message) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: this.systemPrompt },
            { role: "user", content: message.text },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM request failed with HTTP ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content;
      if (typeof reply !== "string" || reply.trim() === "") {
        throw new Error("LLM response did not include choices[0].message.content");
      }

      return reply;
    } finally {
      clearTimeout(timeout);
    }
  }
}
