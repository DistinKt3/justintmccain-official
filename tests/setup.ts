import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// heic2any references Worker at module-load time; stub it so the import
// doesn't crash in jsdom. Actual HEIC conversion requires a real browser.
if (typeof globalThis.Worker === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).Worker = class Worker {
    constructor(_url: string) {}
    postMessage(_msg: unknown) {}
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

afterEach(() => {
  cleanup();
});
