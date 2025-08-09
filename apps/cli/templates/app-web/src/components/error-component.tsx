import {
  ErrorComponent as DefaultErrorComponent,
  Link,
} from '@tanstack/react-router';
import { useTranslations } from 'use-intl';

import { Button } from './ui/button';

export function ErrorComponent({ error }: { error: Error }) {
  const t = useTranslations();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 pb-20">
      <p className="text-lg font-semibold">{t('defaultComponents.error')}</p>
      {import.meta.env.DEV && <DefaultErrorComponent error={error} />}
      <Button asChild variant="link">
        <Link to="/{-$locale}">{t('defaultComponents.returnToHomePage')}</Link>
      </Button>
    </div>
  );
}
