import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library's auto-cleanup relies on detecting a global
// `afterEach` (as Jest provides); this project doesn't set `test.globals`
// in vitest.config.ts, so it must be wired up explicitly here — otherwise
// each render() accumulates in the DOM across tests within a file.
afterEach(() => {
  cleanup();
});

// Node 26's own experimental global `localStorage` clashes with jsdom's
// implementation in this environment (throws "not available because
// --localstorage-file was not provided" instead of jsdom's working Storage).
// Replacing it with a plain in-memory Storage sidesteps that version
// interaction entirely and is deterministic regardless of the Node/jsdom
// version pairing.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

Object.defineProperty(window, "localStorage", { value: new MemoryStorage(), configurable: true });
Object.defineProperty(window, "sessionStorage", {
  value: new MemoryStorage(),
  configurable: true,
});
