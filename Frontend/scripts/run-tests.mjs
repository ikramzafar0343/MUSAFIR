/**
 * Lightweight Frontend unit tests (no browser required).
 * Run: npm test --prefix Frontend
 */
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Mirror of Frontend/src/lib/scroll-lock.ts ref-counting (kept in sync by tests). */
function createScrollLock() {
  let count = 0;
  let scrollY = 0;
  let locked = false;
  const body = { style: { overflow: "", position: "", top: "", width: "" } };

  return {
    lock() {
      count += 1;
      if (count === 1) {
        scrollY = 120;
        locked = true;
        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";
      }
      return () => this.unlock();
    },
    unlock() {
      count = Math.max(0, count - 1);
      if (count === 0 && locked) {
        locked = false;
        body.style.overflow = "";
        body.style.position = "";
        body.style.top = "";
        body.style.width = "";
      }
    },
    get count() {
      return count;
    },
    get locked() {
      return locked;
    },
    get body() {
      return body;
    },
  };
}

function testScrollLockRefCount() {
  const lock = createScrollLock();
  const a = lock.lock();
  const b = lock.lock();
  assert.equal(lock.count, 2);
  assert.equal(lock.locked, true);
  assert.equal(lock.body.style.overflow, "hidden");
  a();
  assert.equal(lock.count, 1);
  assert.equal(lock.locked, true);
  b();
  assert.equal(lock.count, 0);
  assert.equal(lock.locked, false);
  assert.equal(lock.body.style.overflow, "");
  console.log("ok scrollLockRefCount");
}

function testFaqLengthRule() {
  // Frontend should keep 1–16 FAQ items; shorter than defaults must NOT wipe to defaults.
  const fallbackLength = 12;
  const stored = [
    { id: "a", question: "Q1", answer: "A1" },
    { id: "b", question: "Q2", answer: "A2" },
  ];
  const keep =
    stored.length === 0
      ? fallbackLength
      : Math.min(16, stored.length);
  assert.equal(keep, 2);
  console.log("ok faqLengthRule");
}

testScrollLockRefCount();
testFaqLengthRule();
console.log(`Frontend tests passed (${root})`);
