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
  // Cross-tenant, no school-scoped permissions apply — it uses /schools, not /dashboard.
  PLATFORM_ADMIN: [],
  SUPER_ADMIN: [
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write', 'teachers:delete',
    'fees:read', 'fees:write',
    'attendance:read', 'attendance:write',
    'reports:read', 'dashboard:read',
  ],
  ADMIN: [
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write', 'teachers:delete',
    'fees:read', 'fees:write',
    'attendance:read', 'attendance:write',
    'reports:read', 'dashboard:read',
  ],
  TEACHER: [
    'students:read',
    'attendance:read', 'attendance:write',
    'dashboard:read',
  ],
  STUDENT: [
    'fees:read',
    'attendance:read',
    'dashboard:read',
  ],
  PARENT: [
    'fees:read',
    'attendance:read',
    'dashboard:read',
  ],
  ACCOUNTANT: [
    'fees:read',
    'fees:write',
    'dashboard:read',
  ],
  SCHOOL_ADMIN: [
    'students:read', 'students:write', 'students:delete',
    'teachers:read', 'teachers:write', 'teachers:delete',
    'attendance:read', 'attendance:write',
    'reports:read', 'dashboard:read',
  ],
};

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};

export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] ?? [];
};