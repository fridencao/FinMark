import '@testing-library/jest-dom';

/**
 * jsdom 29 + vitest 4 + Node 22+ 组合下,jsdom 的 `localStorage` 没有
 * 挂到 globalThis 上(只有 `window.localStorage`),而 store 测试用
 * persist 中间件直接在 globalThis 上访问 `localStorage`,导致
 * `Cannot read properties of undefined (reading 'clear')`。
 * 兜底:在 setup 阶段给 globalThis 补一个 in-memory Storage。
 */
if (typeof (globalThis as { localStorage?: Storage }).localStorage === 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() { return store.size; },
    clear() { store.clear(); },
    getItem(key) { return store.has(key) ? store.get(key)! : null; },
    key(index) { return Array.from(store.keys())[index] ?? null; },
    removeItem(key) { store.delete(key); },
    setItem(key, value) { store.set(key, String(value)); },
  };
  (globalThis as { localStorage?: Storage }).localStorage = memoryStorage;
  if (typeof window !== 'undefined') {
    (window as { localStorage?: Storage }).localStorage = memoryStorage;
  }
}
