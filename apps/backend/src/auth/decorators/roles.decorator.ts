import { SetMetadata } from '@nestjs/common';

export type UserRole = 'CUSTOMER' | 'ADMIN' | 'MANAGER';
export const UserRoles = {
  CUSTOMER: 'CUSTOMER' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
  MANAGER: 'MANAGER' as UserRole,
} as const;

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);