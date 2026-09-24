import { useEffect, useState } from 'react';

/**
 * A value that stops moving before it is read.
 *
 * For a setting a reader changes by dragging: the slider itself must follow the
 * pointer, but whatever the value asks the network for must wait until the drag
 * settles, or a single sweep fires a request per step.
 *
 * The first render returns the value unchanged, so the server and the client
 * agree on it.
 */
export function useDebounced<TValue>(value: TValue, delayMs: number): TValue {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return settled;
}
