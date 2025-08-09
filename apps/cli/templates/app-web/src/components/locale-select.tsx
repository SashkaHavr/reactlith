import type { Locale } from 'use-intl';
import { useNavigate } from '@tanstack/react-router';

import { isLocale, locales } from '@reactlith-template/intl';

import { useLocaleFromRoute } from '~/lib/route-context-hooks';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const localeToText: Record<Locale, string> = {
  en: 'English',
};

export function LocaleSelect({ className }: { className?: string }) {
  const locale = useLocaleFromRoute();
  const navigate = useNavigate({ from: '/{-$locale}' });
  return (
    <Select
      value={locale}
      onValueChange={(e) => {
        if (isLocale(e)) {
          void navigate({ params: { locale: e } });
        }
      }}
    >
      <SelectTrigger className={className}>
        {locale && <SelectValue>{localeToText[locale]}</SelectValue>}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {locales.map((l) => {
            return (
              <SelectItem key={l} value={l}>
                {localeToText[l]}
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
