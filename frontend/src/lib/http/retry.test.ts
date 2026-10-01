import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { retry } from '#/lib/http/retry';
import type { RetryFunc, RetryParams } from '#/lib/http/retry';

describe('retry', () => {
  async function runRetry<R>(params: RetryParams, maybeFunc?: RetryFunc<R>) {
    const func = maybeFunc ?? (() => Promise.reject(new Error('always failing')));
    const spy = vi.fn(func);

    // Preserve the empty name of the anonymous functions. Spy wrapper overrides it.
    const funcParam = func.name === '' ? (...args: Parameters<RetryFunc<R>>) => spy(...args) : spy;

    const promise = retry(funcParam, params).catch((err: unknown) => `throw ${String(err)}`);

    await vi.runAllTimersAsync();
    const result = await promise;

    const retries = spy.mock.calls.map(([attempt, nextDelayMs]) => {
      const suffix = nextDelayMs === undefined ? '' : 'ms';
      return `${attempt}: ${String(nextDelayMs)}${suffix}`;
    });

    return [...retries, result];
  }

  // Remove randomness and real delays from the tests.
  beforeAll(() => {
    vi.useFakeTimers();
  });
  afterAll(() => {
    vi.useRealTimers();
  });
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  describe('stops on a successful attempt', () => {
    it('first attempt', async () => {
      expect(await runRetry({}, async () => 'ok')).toMatchInlineSnapshot(`
        [
          "1: 200ms",
          "ok",
        ]
      `);
    });
    it('middle attempt', async () => {
      const func: RetryFunc<'ok'> = async attempt => {
        if (attempt !== 2) {
          throw new Error('middle failure');
        }
        return 'ok';
      };

      expect(await runRetry({}, func)).toMatchInlineSnapshot(`
        [
          "1: 200ms",
          "2: 300ms",
          "ok",
        ]
      `);
    });
    it('last attempt', async () => {
      const func: RetryFunc<'ok'> = async attempt => {
        if (attempt !== 3) {
          throw new Error('last failure');
        }
        return 'ok';
      };

      expect(await runRetry({}, func)).toMatchInlineSnapshot(`
        [
          "1: 200ms",
          "2: 300ms",
          "3: undefined",
          "ok",
        ]
      `);
    });
  });

  it('produces a reasonable retry sequence within maxAttempts', async () => {
    expect(await runRetry({})).toMatchInlineSnapshot(`
      [
        "1: 200ms",
        "2: 300ms",
        "3: undefined",
        "throw Error: always failing",
      ]
    `);

    expect(await runRetry({ maxAttempts: 5 })).toMatchInlineSnapshot(`
      [
        "1: 200ms",
        "2: 300ms",
        "3: 600ms",
        "4: 1125ms",
        "5: undefined",
        "throw Error: always failing",
      ]
    `);
  });

  it('turns into a fixed delay retry algorithm if min/max bounds are equal', async () => {
    expect(await runRetry({ maxAttempts: 3, minDelayMs: 200, maxDelayMs: 200 })).toMatchInlineSnapshot(`
      [
        "1: 200ms",
        "2: 200ms",
        "3: undefined",
        "throw Error: always failing",
      ]
    `);
  });

  it('allows for zero delay', async () => {
    expect(await runRetry({ maxAttempts: 3, minDelayMs: 0, maxDelayMs: 0 })).toMatchInlineSnapshot(`
      [
        "1: 0ms",
        "2: 0ms",
        "3: undefined",
        "throw Error: always failing",
      ]
    `);
  });

  describe('fails on first non-retryable error', () => {
    it('all errors are retryable', async () => {
      expect(await runRetry({ isRetryable: () => false })).toMatchInlineSnapshot(`
        [
          "1: 200ms",
          "throw Error: always failing",
        ]
      `);
    });
    it('middle error is non-retriable', async () => {
      const func: RetryFunc<never> = async attempt => {
        if (attempt === 3) {
          throw new Error('non-retryable');
        }
        throw new Error('retryable');
      };

      const params: RetryParams = {
        isRetryable: error => error.message === 'retryable',
      };

      expect(await runRetry(params, func)).toMatchInlineSnapshot(`
        [
          "1: 200ms",
          "2: 300ms",
          "3: undefined",
          "throw Error: non-retryable",
        ]
      `);
    });
  });

  it('rejects invalid inputs', async () => {
    expect(await runRetry({ maxAttempts: 0 })).toMatchInlineSnapshot(`
      [
        "throw Error: Invalid 'maxAttempts' for retry: 0",
      ]
    `);
    expect(await runRetry({ minDelayMs: -1 })).toMatchInlineSnapshot(`
      [
        "throw Error: Invalid 'minDelayMs' for retry: -1",
      ]
    `);
    expect(await runRetry({ maxDelayMs: 100 })).toMatchInlineSnapshot(`
      [
        "throw Error: Invalid 'maxDelayMs' for retry: 100, 'minDelayMs' is 200",
      ]
    `);
  });

  it('should use the provided label in logs', async () => {
    expect(await runRetry({ label: 'test-routine' })).toMatchInlineSnapshot(`
      [
        "1: 200ms",
        "2: 300ms",
        "3: undefined",
        "throw Error: always failing",
      ]
    `);

    expect(consoleErrorSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "All 3 attempts failed: test-routine",
          [Error: always failing],
        ],
      ]
    `);
  });

  it('should use the function name in logs', async () => {
    async function testFunc() {
      throw new Error('always failing');
    }

    expect(await runRetry({}, testFunc)).toMatchInlineSnapshot(`
      [
        "1: 200ms",
        "2: 300ms",
        "3: undefined",
        "throw Error: always failing",
      ]
    `);

    expect(consoleErrorSpy.mock.calls).toMatchInlineSnapshot(`
      [
        [
          "All 3 attempts failed: Mock",
          [Error: always failing],
        ],
      ]
    `);
  });
});
