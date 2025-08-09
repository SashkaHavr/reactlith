import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { ErrorComponent } from './components/error-component';
import { NotFoundComponent } from './components/not-found-component';
import { PendingComponent } from './components/pending-component';
import { createTRPCRouteContext, TRPCProvider } from './lib/trpc';
import { routeTree } from './routeTree.gen';

export function createRouter() {
  const trpcRouteContext = createTRPCRouteContext();

  const router = createTanStackRouter({
    context: { ...trpcRouteContext },
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPreload: 'intent',
    defaultPendingComponent: PendingComponent,
    defaultNotFoundComponent: NotFoundComponent,
    defaultErrorComponent: ErrorComponent,
    Wrap: (props) => {
      return (
        <TRPCProvider
          trpcClient={trpcRouteContext.trpcClient}
          queryClient={trpcRouteContext.queryClient}
        >
          {props.children}
        </TRPCProvider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router: router,
    queryClient: trpcRouteContext.queryClient,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
