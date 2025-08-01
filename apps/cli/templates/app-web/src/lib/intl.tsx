import type { Formats } from 'use-intl';
import { Navigate, useParams, useRouteContext } from '@tanstack/react-router';
import { IntlProvider as BaseIntlProvider } from 'use-intl';

import { defaultLocale, isLocale } from '@reactlith-template/intl';

function getPreferredLocale() {
  if (
    typeof navigator !== 'undefined' &&
    'languages' in navigator &&
    Array.isArray(navigator.languages)
  ) {
    const preferredLocales = navigator.languages.filter(isLocale);
    const firstPreferredLocale = preferredLocales[0];
    if (firstPreferredLocale) {
      return firstPreferredLocale;
    }
  }
}

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const intl = useRouteContext({ from: '/{-$locale}', select: (s) => s.intl });
  const { locale } = useParams({ from: '/{-$locale}' });
  if (!isLocale(locale)) {
    const preferredLocale = getPreferredLocale();
    if (preferredLocale != defaultLocale) {
      return <Navigate to="/{-$locale}" params={{ locale: preferredLocale }} />;
    }
  }
  return (
    <BaseIntlProvider
      messages={intl.messages}
      locale={intl.locale}
      timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone}
      formats={formats}
    >
      {children}
    </BaseIntlProvider>
  );
}

const formats = {} satisfies Formats;

declare module 'use-intl' {
  interface AppConfig {
    Formats: typeof formats;
  }
}
