import { envServer } from '@reactlith-template/env/server';

import { publicProcedure, router } from '#init.ts';

export const configRouter = router({
  authConfig: publicProcedure.query(() => {
    return {
      devMagicLink: envServer.AUTH_DEV_MAGIC_LINK,
    };
  }),
});
