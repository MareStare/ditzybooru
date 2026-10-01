import { useEffect, useState } from 'react';

import { timeAgo } from '#/lib/format';
import { cn } from '#/lib/utils';

import type { ClassValue } from '#/lib/utils';

interface Props {
  className?: ClassValue;
  /** An ISO 8601 timestamp. */
  dateTime: string;
}

/** How long the text stays the same, in milliseconds. */
function refreshDelayMs(date: Date, now: Date): number {
  const ageMs = Math.abs(now.getTime() - date.getTime());

  if (ageMs < 60_000) {
    return 1000;
  }

  return ageMs < 3_600_000 ? 30_000 : 600_000;
}

/** A relative time, e.g. `"9 minutes ago"`, that stays current. */
export function RelativeTime({ className, dateTime }: Props) {
  const date = new Date(dateTime);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const target = new Date(dateTime);

    const refresh = () => {
      const next = new Date();
      setNow(next);
      timer = setTimeout(refresh, refreshDelayMs(target, next));
    };

    let timer = setTimeout(refresh, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [dateTime]);

  return (
    // The browser hydrates later than the server renders, so the text differs.
    // The effect above replaces it right after hydration.
    <time className={cn(className)} dateTime={date.toISOString()} suppressHydrationWarning>
      {timeAgo(date, now)}
    </time>
  );
}
