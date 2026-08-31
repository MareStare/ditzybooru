import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { BottomNav } from '#/components/layout/BottomNav';
import { SiteHeader } from '#/components/layout/SiteHeader';
import { SiteFooter } from '#/components/layout/SiteFooter';
import { SsrSettingsContext, useSettings } from '#/hooks/useSettings';
import { readSettings, settingsAttributes } from '#/lib/settings';

// The one stylesheet entry point: `styles/index.css` imports every other CSS
// file in the project, so the whole site compiles to a single stylesheet. Start
// records it in the route manifest and `<HeadContent />` links it, hashed.
import '#/styles/index.css';

export const Route = createRootRoute({
  // Read once per request rather than per component, so the whole tree renders
  // from one snapshot of the cookie.
  beforeLoad: () => ({ settings: readSettings() }),
  head: () => ({
    // Dev only, and only because Start's own dev SSR stylesheet is disabled in
    // `vite.config.ts` over https://github.com/TanStack/router/issues/7794
    // (fix pending in https://github.com/TanStack/router/pull/7830). Without a
    // link the first paint is unstyled: in dev the stylesheet is a module Vite
    // injects after hydration. Production links the hashed file via the
    // manifest, so this whole branch goes away once that bug is fixed.
    links: import.meta.env.DEV ? [{ rel: 'stylesheet', href: '/src/styles/index.css?direct' }] : [],
    meta: [
      { charSet: 'UTF-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      { title: 'Ditzybooru' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const { settings } = Route.useRouteContext();

  return (
    <SsrSettingsContext.Provider value={settings}>
      <Document />
    </SsrSettingsContext.Provider>
  );
}

/* Split from `RootComponent` so it reads the settings through the same hook
 * every other component uses: the provider has to be mounted above whoever
 * calls `useSettings`. */
function Document() {
  const settings = useSettings();

  return (
    <html lang="en" {...settingsAttributes(settings)}>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="app-shell">
          <SiteHeader />
          <main className="app-shell__main">
            <Outlet />
          </main>
          <SiteFooter />
          <BottomNav />
          {/* The router devtools panel is out: `router-devtools-core` reads
              `router.stores.pendingMatches`, which router 1.170 removed, and it
              throws on every page load. Nothing newer is published yet. */}
        </div>
        <Scripts />
      </body>
    </html>
  );
}
