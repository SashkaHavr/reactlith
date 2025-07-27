import type { Locale } from 'use-intl';
import { useNavigate } from '@tanstack/react-router';
import { useLocale } from 'use-intl';

import { isLocale, locales } from '@reactlith-template/intl';

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
  const locale = useLocale();
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
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {locales.map((l) => (
            <SelectItem key={l} value={l}>
              {localeToText[l]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
