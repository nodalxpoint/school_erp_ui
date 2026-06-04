// core/models/permissions.model.ts

import { UserRole } from './auth.model';

export type Permission =
  | 'students:read' | 'students:write' | 'students:delete'
  | 'teachers:read' | 'teachers:write' | 'teachers:delete'
  | 'fees:read' | 'fees:write'
  | 'attendance:read' | 'attendance:write'
  | 'reports:read'
  | 'dashboard:read';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write', 'teachers:delete',
    'fees:read', 'fees:write',
    'attendance:read', 'attendance:write',
    'reports:read', 'dashboard:read',
  ],
  teacher: [
    'students:read',
    'attendance:read', 'attendance:write',
    'dashboard:read',
  ],
  student: [
    'fees:read',
    'attendance:read',
    'dashboard:read',
  ],
  parent: [
    'fees:read',
    'attendance:read',
    'dashboard:read',
  ],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};