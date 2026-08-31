import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { BottomNav } from '#/components/layout/BottomNav';
import { SiteHeader } from '#/components/layout/SiteHeader';
import { SiteFooter } from '#/components/layout/SiteFooter';
import { SsrSettingsContext, useSettings } from '#/hooks/useSettings';
import { readSettings, settingsAttributes } from '#/lib/settings';
import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';

// The one stylesheet entry point: `styles/index.css` imports every other CSS
// file in the project, so the whole site compiles to a single stylesheet. Start
// records it in the route manifest and `<HeadContent />` links it, hashed.
import '#/styles/index.css';

export const Route = createRootRoute({
  // Read once per request rather than per component, so the whole tree renders
  // from one snapshot of the cookie.
  beforeLoad: () => ({ settings: readSettings() }),
  head: () => ({
    links: [
      // The font is declared inside the stylesheet, so without this the browser
      // cannot even ask for it until the CSS has downloaded and parsed - a whole
      // round trip during which the text paints in `system-ui` and then swaps.
      // Preloading starts the fetch alongside the CSS instead. `crossOrigin` is
      // required even same-origin, or the preload is discarded and refetched.
      {
        rel: 'preload',
        href: interLatin,
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      // Dev only, and only because Start's own dev SSR stylesheet is disabled
      // in `vite.config.ts` over https://github.com/TanStack/router/issues/7794
      // (fix pending in https://github.com/TanStack/router/pull/7830). Without
      // a link the first paint is unstyled: in dev the stylesheet is a module
      // Vite injects after hydration. Production links the hashed file via the
      // manifest, so this whole branch goes away once that bug is fixed.
      ...(import.meta.env.DEV ? [{ rel: 'stylesheet', href: '/src/styles/index.css?direct' }] : []),
    ],
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
      {/* Some browser extensions (e.g. Grammarly) inject new attributes into
      the <body> which generates a huge error in console. So we suppress
      that warning on this node. */}
      <body suppressHydrationWarning>
        <div className="app-shell">
          <SiteHeader />
          <main className="app-shell__main">
            <Outlet />
          </main>
          <SiteFooter />
          <BottomNav />
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
          />
        </div>
        <Scripts />
      </body>
    </html>
  );
}
