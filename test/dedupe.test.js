import test from "node:test";
import assert from "node:assert/strict";
import { DedupeStore } from "../src/dedupe.js";

test("DedupeStore reports a repeated key", () => {
  const store = new DedupeStore({ ttlMs: 1000 });
  assert.equal(store.hasSeen("m1", 100), false);
  assert.equal(store.hasSeen("m1", 200), true);
});

test("DedupeStore lets expired keys through", () => {
  const store = new DedupeStore({ ttlMs: 1000 });
  assert.equal(store.hasSeen("m1", 100), false);
  assert.equal(store.hasSeen("m1", 1200), false);
});
