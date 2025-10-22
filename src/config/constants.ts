import { AdminRole } from '@prisma/client';

export const ADMIN_ROLES_HIERARCHY_VALUES = {
  [AdminRole.CLIENT_OWNER]: 40,
  [AdminRole.CLIENT_ADMIN]: 30,
  [AdminRole.UNITY_ADMIN]: 20,
  [AdminRole.QUEUE_ADMIN]: 10,
};
