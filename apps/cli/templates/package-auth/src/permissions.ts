import { createAccessControl } from 'better-auth/plugins/access';
import { adminAc, defaultStatements } from 'better-auth/plugins/admin/access';

const statement = {
  ...defaultStatements,
} as const;

const ac = createAccessControl(statement);

const user = ac.newRole({ user: [] });

const admin = ac.newRole({
  ...adminAc.statements,
});

export const permissions = {
  ac,
  roles: { admin, user },
};

const allRoles = Object.keys(permissions.roles);
export type Role = keyof typeof permissions.roles;
export function isRole(role: string | null | undefined): role is Role {
  return !!role && allRoles.includes(role);
}
export function getRoles(roleArray: string | null | undefined) {
  if (!roleArray) return;
  const roles = roleArray.split(',');
  if (roles.length > 0 && roles.every(isRole)) {
    return roles;
  }
}

export function isRoleArray(
  roleArray: string | null | undefined,
): roleArray is string {
  return getRoles(roleArray) != undefined;
}
