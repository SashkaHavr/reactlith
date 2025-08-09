import type { VariantProps } from 'class-variance-authority';
import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';

import type { buttonVariants } from './ui/button';
import { useIsClient } from '~/hooks/use-is-client';
import { Button } from './ui/button';

export function ThemeToggle(
  props: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    },
) {
  const { resolvedTheme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(resolvedTheme == 'light' ? 'dark' : 'light')}
      {...props}
    >
      {!isClient ? (
        <div />
      ) : resolvedTheme == 'light' ? (
        <SunIcon />
      ) : (
        <MoonIcon />
      )}
    </Button>
  );
}
