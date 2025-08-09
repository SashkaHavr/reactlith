import { Link } from '@tanstack/react-router';

import { useTranslationsFromRoute } from '~/hooks/route-context';
import { Button } from './ui/button';

export function NotFoundComponent() {
  const t = useTranslationsFromRoute();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 pb-20">
      <p className="text-lg font-semibold">
        {t?.defaultComponents.notFound ?? 'Not found'}
      </p>
      <Button asChild variant="link">
        <Link to="/{-$locale}">
          {t?.defaultComponents.returnToHomePage ?? 'Home page'}
        </Link>
      </Button>
    </div>
  );
}
