import { useTranslations } from 'use-intl';

import { LoadingSpinner } from './ui/loading-spinner';

export function PendingComponent() {
  const t = useTranslations();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-1 pb-20">
      <LoadingSpinner />
      {<p className="text-lg">{t('defaultComponents.loading')}</p>}
    </div>
  );
}
