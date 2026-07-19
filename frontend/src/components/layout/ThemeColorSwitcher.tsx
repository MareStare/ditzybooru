import { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { applyThemeColor, DEFAULT_THEME_COLOR, readThemeColor, THEME_COLORS } from '#/lib/theme';
import type { ThemeColor } from '#/lib/theme';
import { cn } from '#/lib/utils';

/** Accent-color picker: a palette button revealing a grid of color swatches. */
export function ThemeColorSwitcher() {
  const [color, setColor] = useState<ThemeColor>(DEFAULT_THEME_COLOR);

  // Sync from whatever the pre-paint init script already applied to <html>.
  useEffect(() => {
    setColor(readThemeColor());
  }, []);

  const select = (next: ThemeColor) => {
    applyThemeColor(next);
    setColor(next);
  };

  return (
    <div className="group relative">
      <Button variant="ghost" size="icon-sm" title="Accent color" aria-label="Accent color">
        <Palette />
      </Button>

      {/* `pt-1` (not `mt-1`) offsets the panel while keeping this wrapper flush
          with the button, so there's no dead zone to cross on the way down. */}
      <div className="invisible absolute right-0 top-full z-30 pt-1 opacity-0 transition-[opacity,transform] duration-150 -translate-y-1 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <div className="w-max rounded-lg border bg-popover p-2 shadow-lg">
          <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">Accent color</p>
          <div className="grid grid-cols-3 gap-1.5">
            {THEME_COLORS.map(entry => {
              const active = entry.id === color;
              // Gray is the one unsaturated swatch; every other color previews at a
              // fixed chroma over its `--theme-hue-<id>` defined in global.css.
              const chroma = entry.id === 'gray' ? '0' : '0.16';
              return (
                <button
                  key={entry.id}
                  type="button"
                  title={entry.label}
                  aria-label={entry.label}
                  aria-pressed={active}
                  onClick={() => {
                    select(entry.id);
                  }}
                  style={{ background: `oklch(0.62 ${chroma} var(--theme-hue-${entry.id}))` }}
                  className={cn(
                    'flex size-7 items-center justify-center rounded-md border border-black/10 text-white transition-transform hover:scale-110',
                    active ? 'ring-2 ring-ring ring-offset-2 ring-offset-popover' : null,
                  )}
                >
                  {active ? <Check className="size-4 drop-shadow" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
