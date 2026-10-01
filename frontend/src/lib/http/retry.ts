export interface RetryParams {
  /** The first attempt counts too, so `1` means no retries. */
  maxAttempts?: number;

  /** Delay before the first retry. Later delays grow exponentially. */
  minDelayMs?: number;

  /** Upper bound of the exponential delay. */
  maxDelayMs?: number;

  /** Errors that are not instances of `Error` are never retried. */
  isRetryable?: (error: Error) => boolean;

  /** Names the operation in the logs. The default is the function name. */
  label?: string;
}

/** `nextDelayMs` is `undefined` on the last attempt. */
export type RetryFunc<TResult> = (attempt: number, nextDelayMs?: number) => Promise<TResult>;

/**
 * Retries an async operation with exponential backoff and equal jitter.
 * See https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 */
export async function retry<TResult>(func: RetryFunc<TResult>, params: RetryParams = {}): Promise<TResult> {
  const { maxAttempts = 3, minDelayMs = 200, maxDelayMs = 1500, isRetryable } = params;

  if (maxAttempts < 1) {
    throw new Error(`Invalid 'maxAttempts' for retry: ${maxAttempts}`);
  }
  if (minDelayMs < 0) {
    throw new Error(`Invalid 'minDelayMs' for retry: ${minDelayMs}`);
  }
  if (maxDelayMs < minDelayMs) {
    throw new Error(`Invalid 'maxDelayMs' for retry: ${maxDelayMs}, 'minDelayMs' is ${minDelayMs}`);
  }

  const label = params.label ?? (func.name || '{unnamed routine}');
  const backoffExponent = 2;

  let attempt = 1;
  let nextDelayMs = minDelayMs;

  for (;;) {
    const hasNextAttempts = attempt < maxAttempts;

    try {
      // The `await` keeps the rejection inside this `try`.
      return await func(attempt, hasNextAttempts ? nextDelayMs : undefined);
    } catch (error) {
      if (!(error instanceof Error) || (isRetryable !== undefined && !isRetryable(error))) {
        throw error;
      }

      if (!hasNextAttempts) {
        console.error(`All ${maxAttempts} attempts of running ${label} failed`, error);
        throw error;
      }

      console.warn(
        `[Attempt ${attempt}/${maxAttempts}] Error when running ${label}. Retrying in ${nextDelayMs} ms`,
        error,
      );

      await sleep(nextDelayMs);

      // Equal jitter: half of the exponential delay is fixed, half is random.
      // The random half keeps many clients from retrying at the same time.
      const pure = Math.min(maxDelayMs, minDelayMs * backoffExponent ** attempt);
      nextDelayMs = Math.max(minDelayMs, pure / 2 + randomBetween(0, pure / 2));

      attempt += 1;
    }
  }
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
