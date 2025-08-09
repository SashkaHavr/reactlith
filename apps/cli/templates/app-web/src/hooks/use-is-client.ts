import { useEffect, useState } from 'react';

export function useIsClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
