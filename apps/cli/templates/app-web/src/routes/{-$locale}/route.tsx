import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import {
  defaultLocale,
  getIntlContext,
  isLocale,
} from '@reactlith-template/intl';

import { IntlProvider } from '~/lib/intl';
import { getAcceptLanguageHeaderServerFn } from '~/lib/intl-server';

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: async ({ params }) => {
    if (params.locale && !isLocale(params.locale)) {
      throw redirect({ to: '/{-$locale}', params: { locale: undefined } });
    }

    if (params.locale == undefined) {
      const acceptLanguageHeader = await getAcceptLanguageHeaderServerFn();
      if (Array.isArray(acceptLanguageHeader)) {
        const preferredLocales = acceptLanguageHeader.filter(isLocale);
        const firstPreferredLocale = preferredLocales[0];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (firstPreferredLocale && firstPreferredLocale != defaultLocale) {
          throw redirect({
            to: '/{-$locale}',
            params: { locale: firstPreferredLocale },
          });
        }
      }
    }

    const intl = await getIntlContext(params.locale);
    if (intl.locale != params.locale && intl.locale != defaultLocale) {
      throw redirect({
        to: '/{-$locale}',
        params: { locale: intl.locale },
      });
    }
    return {
      intl,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <IntlProvider>
      <Outlet />
    </IntlProvider>
  );
}
