import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';

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

  return routerWithQueryClient(router, trpcRouteContext.queryClient);
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
