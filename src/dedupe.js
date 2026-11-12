export class DedupeStore {
  constructor({ ttlMs = 10 * 60 * 1000, maxEntries = 5000 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.items = new Map();
  }

  hasSeen(key, now = Date.now()) {
    this.prune(now);
    if (this.items.has(key)) return true;
    this.items.set(key, now + this.ttlMs);
    if (this.items.size > this.maxEntries) {
      const oldestKey = this.items.keys().next().value;
      this.items.delete(oldestKey);
    }
    return false;
  }

  prune(now = Date.now()) {
    for (const [key, expiresAt] of this.items.entries()) {
      if (expiresAt <= now) this.items.delete(key);
    }
  }
}
