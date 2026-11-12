export function createLogger(output = console) {
  return {
    debug(message, meta) {
      if (process.env.LOG_LEVEL === "debug") output.debug(message, safeMeta(meta));
    },
    info(message, meta) {
      output.info(message, safeMeta(meta));
    },
    warn(message, meta) {
      output.warn(message, safeMeta(meta));
    },
    error(message, meta) {
      output.error(message, safeMeta(meta));
    },
  };
}

function safeMeta(meta) {
  if (!meta) return undefined;
  const clone = { ...meta };
  delete clone.content;
  delete clone.message;
  delete clone.secret;
  delete clone.apiKey;
  delete clone.token;
  return clone;
}
