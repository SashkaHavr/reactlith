import {
  isMatch,
  useRouteContext,
  useRouterState,
} from '@tanstack/react-router';

export function useAuth() {
  return useRouteContext({ from: '__root__', select: (s) => s.auth });
}

export function useLoggedInAuth() {
  const auth = useAuth();
  if (!auth.loggedIn) {
    throw new Error('Auth is not defined');
  }
  return auth;
}

export function useTranslationsFromRoute() {
  const matches = useRouterState({ select: (s) => s.matches }).filter((m) =>
    isMatch(m, 'context.intl.messages'),
  );
  return matches[0]?.context.intl.messages;
}

export function useLocaleFromRoute() {
  const matches = useRouterState({ select: (s) => s.matches }).filter((m) =>
    isMatch(m, 'context.intl.locale'),
  );
  return matches[0]?.context.intl.locale;
}
