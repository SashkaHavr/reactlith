import type { QueryClient } from '@tanstack/react-query';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import {
  adminClient,
  inferAdditionalFields,
  magicLinkClient,
} from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import type { auth } from '@reactlith-template/auth';
import type { Role } from '@reactlith-template/auth/permissions';
import {
  getRoles,
  isRoleArray,
  permissions,
} from '@reactlith-template/auth/permissions';

import { getSessionServerFn } from './auth-server';

export const authClient = createAuthClient({
  basePath: '/auth',
  plugins: [
    inferAdditionalFields<typeof auth>(),
    magicLinkClient(),
    adminClient(permissions),
  ],
  fetchOptions: { throw: true },
});

const authBaseKey = 'auth';

export const authGetSessionOptions = queryOptions({
  queryKey: [authBaseKey, 'getSession'],
  queryFn: async () => await getSessionServerFn(),
});

export async function getAuthContext(queryClient: QueryClient) {
  try {
    const session = await queryClient.ensureQueryData(authGetSessionOptions);
    return session != null
      ? {
          available: true as const,
          loggedIn: true as const,
          session: session.session,
          user: session.user,
        }
      : {
          available: true as const,
          loggedIn: false as const,
        };
  } catch {
    return {
      available: false as const,
      loggedIn: false as const,
    };
  }
}

export function useResetAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    await queryClient.resetQueries({ queryKey: [authBaseKey] });
    await router.invalidate();
  };
}

export function hasPermissions(
  user: typeof authClient.$Infer.Session.user,
  permissions: NonNullable<
    Parameters<typeof authClient.admin.checkRolePermission>[0]['permission']
  >,
) {
  return (
    isRoleArray(user.role) &&
    authClient.admin.checkRolePermission({
      role: user.role as Role,
      permissions: permissions,
    })
  );
}

export function hasAnyRoleExceptUser(
  user: typeof authClient.$Infer.Session.user,
) {
  const roles = getRoles(user.role);
  return roles && roles.filter((r) => r != 'user').length > 0;
}

export function useSignout() {
  const resetAuth = useResetAuth();
  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSuccess: async () => {
      await resetAuth();
    },
  });
}
