import { createMiddleware, createServerFn } from '@tanstack/react-start';
import { getWebRequest } from '@tanstack/react-start/server';

import { auth } from '@reactlith-template/auth';

export const authServerFnMiddleware = createMiddleware({
  type: 'function',
}).server(({ next }) => {
  return next({
    context: {
      auth: auth.api,
      headers: getWebRequest().headers,
    },
  });
});

export const getSessionServerFn = createServerFn()
  .middleware([authServerFnMiddleware])
  .handler(({ context: { auth, headers } }) => {
    return auth.getSession({ headers });
  });
