import { Outlet, createRootRoute, useRouterState } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { TanStackDevtools } from '@tanstack/react-devtools';

import { SiteHeader } from '#/components/layout/SiteHeader';
import { SiteFooter } from '#/components/layout/SiteFooter';

import '../global.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  // `/dev/*` routes are internal tooling that renders its own chrome. The site
  // header and footer would fight them for the page's look.
  const isDevRoute = useRouterState({ select: state => state.location.pathname.startsWith('/dev/') });

  return (
    <div className="flex min-h-screen flex-col">
      {isDevRoute ? null : <SiteHeader />}
      <main className="flex-1">
        <Outlet />
      </main>
      {isDevRoute ? null : <SiteFooter />}
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
