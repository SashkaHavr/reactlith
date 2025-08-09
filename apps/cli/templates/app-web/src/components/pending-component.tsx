import { useTranslationsFromRoute } from '~/hooks/route-context';
import { LoadingSpinner } from './ui/loading-spinner';

export function PendingComponent() {
  const t = useTranslationsFromRoute();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-1 pb-20">
      <LoadingSpinner />
      {t && <p className="text-lg">{t.defaultComponents.loading}</p>}
    </div>
  );
}
