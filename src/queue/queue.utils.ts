import { CreateQueueDto } from './queue.dto';
import {
  CreateQueueBadRequestException,
  defaultQueueExceptionsMessage,
} from './queue.exceptions';
import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';
import { AdminRole } from '@prisma/client';
import { AdminWithClientDto } from 'src/admin/admin.dto';
import { ADMIN_ROLES_HIERARCHY_VALUES } from 'src/config/constants';

export function checkCreateQueueRequirementsOrThrow(data: CreateQueueDto) {
  if (!data.name) {
    throw new CreateQueueBadRequestException(
      defaultQueueExceptionsMessage.NAME_REQUIRED,
    );
  }

  if (!data.type) {
    throw new CreateQueueBadRequestException(
      defaultQueueExceptionsMessage.TYPE_IS_REQUIRED,
    );
  }

  if (!data.clientId) {
    throw new CreateQueueBadRequestException(
      defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
    );
  }

  if (!data.unityId) {
    throw new CreateQueueBadRequestException(
      defaultQueueExceptionsMessage.UNITY_ID_REQUIRED,
    );
  }
}

export function checkAdminAllowedToAccessQueueMethodOrThrow(data: {
  queueUnityId: string;
  authenticatedUser: AdminWithClientDto;
}) {
  const { queueUnityId, authenticatedUser } = data;

  if (!queueUnityId) {
    throw new BadRequestException(`Queue Unity Id must be defined`);
  }

  if (!authenticatedUser) {
    throw new BadRequestException(`User must be defined`);
  }

  const userRole = AdminRole[authenticatedUser.role];
  const userRoleHierarchyValue = ADMIN_ROLES_HIERARCHY_VALUES[userRole];

  if (userRoleHierarchyValue < ADMIN_ROLES_HIERARCHY_VALUES.UNITY_ADMIN) {
    throw new MethodNotAllowedException();
  }

  if (
    userRoleHierarchyValue === ADMIN_ROLES_HIERARCHY_VALUES.UNITY_ADMIN &&
    !authenticatedUser.unityIds?.includes(queueUnityId)
  ) {
    throw new MethodNotAllowedException();
  }
}
