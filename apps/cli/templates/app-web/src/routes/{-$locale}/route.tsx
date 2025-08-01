import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import {
  defaultLocale,
  getIntlContext,
  isLocale,
} from '@reactlith-template/intl';

import { IntlProvider } from '~/lib/intl';

export const Route = createFileRoute('/{-$locale}')({
  ssr: 'data-only',
  beforeLoad: async ({ params }) => {
    if (params.locale && !isLocale(params.locale)) {
      throw redirect({ to: '/{-$locale}', params: { locale: undefined } });
    }
    const intl = await getIntlContext(params.locale);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
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
