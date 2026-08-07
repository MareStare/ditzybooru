import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import { BottomNav } from '#/components/layout/BottomNav';
import { SiteHeader } from '#/components/layout/SiteHeader';
import { SiteFooter } from '#/components/layout/SiteFooter';

// The one stylesheet entry point: `styles/index.css` imports every other CSS
// file in the project, so the whole site compiles to a single stylesheet.
import '#/styles/index.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="app-shell__main">
        <Outlet />
      </main>
      <SiteFooter />
      <BottomNav />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
    </div>
  );
}
