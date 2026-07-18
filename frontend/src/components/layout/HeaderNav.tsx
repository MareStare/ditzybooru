import { ChevronDown, Radio } from 'lucide-react';

import { primaryNav } from '#/lib/mock/site';
import type { NavItem } from '#/lib/mock/site';
import { liveChannelCount } from '#/lib/mock/data';

function NavEntry({ item }: { item: NavItem }) {
  const hasChildren = item.children !== undefined && item.children.length > 0;

  return (
    <div className="group relative">
      <a
        href={item.href}
        className="inline-flex h-full items-center gap-1 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground group-hover:text-foreground"
      >
        {item.label}
        {hasChildren ? (
          <ChevronDown className="size-3.5 opacity-60 transition-transform group-hover:rotate-180" />
        ) : null}
      </a>

      {hasChildren ? (
        // `pt-1` (not `mt-1`) offsets the panel while keeping this wrapper flush
        // with the trigger, so there's no dead zone to cross on the way down.
        <div className="invisible absolute left-0 top-full z-30 pt-1 opacity-0 transition-[opacity,transform] duration-150 -translate-y-1 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="min-w-44 origin-top rounded-lg border bg-popover p-1 shadow-lg">
            {item.children?.map(child => (
              <a
                key={child.href}
                href={child.href}
                className="block rounded-md px-3 py-1.5 text-sm text-popover-foreground transition-colors hover:bg-muted"
              >
                {child.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** The secondary navigation bar (Images / Activity / Forums / Tags / …). */
export function HeaderNav() {
  return (
    <nav className="border-b bg-card/40">
      <div className="flex h-10 items-center gap-1 px-3 md:px-4">
        <div className="hidden items-center md:flex">
          {primaryNav.map(item => (
            <NavEntry key={item.href} item={item} />
          ))}
        </div>

        <a
          href="/channels"
          className="ml-auto inline-flex h-full items-center gap-1.5 px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Radio className="size-3.5 text-green-500" />
          Live
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs tabular-nums">{liveChannelCount}</span>
        </a>
      </div>
    </nav>
  );
}
