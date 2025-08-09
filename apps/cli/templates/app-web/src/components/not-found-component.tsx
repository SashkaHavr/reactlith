import { Link } from '@tanstack/react-router';
import { useTranslations } from 'use-intl';

import { Button } from './ui/button';

export function NotFoundComponent() {
  const t = useTranslations();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 pb-20">
      <p className="text-lg font-semibold">{t('defaultComponents.notFound')}</p>
      <Button asChild variant="link">
        <Link to="/{-$locale}">{t('defaultComponents.returnToHomePage')}</Link>
      </Button>
    </div>
  );
}
