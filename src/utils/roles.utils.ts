import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { ADMIN_ROLES_HIERARCHY_VALUES } from 'src/config/constants';

interface IsAdminRoleHigherThanArgs {
  userRole: AdminRole;
  minRequiredRole: AdminRole;
}

export function checkAdminRoleHigherOrThrow(
  data: IsAdminRoleHigherThanArgs,
): boolean {
  const userRole = AdminRole[data.userRole];
  const minRequiredRole = AdminRole[data.minRequiredRole];

  if (!userRole) {
    throw new BadRequestException(`User Admin Role is not defined`);
  }

  if (!minRequiredRole) {
    throw new BadRequestException(
      `Cannot check Admin Role with Min Requirement not defined`,
    );
  }

  const userHierarchyValue = ADMIN_ROLES_HIERARCHY_VALUES[userRole];
  const minRequiredHierarchyValue =
    ADMIN_ROLES_HIERARCHY_VALUES[minRequiredRole];

  if (userHierarchyValue < minRequiredHierarchyValue) {
    throw new MethodNotAllowedException();
  }

  return true;
}
