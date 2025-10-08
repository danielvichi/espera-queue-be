import { isValidEmail } from 'src/utils/emailParser';
import { CreatedAdminDto } from './admin.dto';
import {
  CreateAdminBadRequestException,
  createAdminBadRequestExceptionMessages,
} from './admin.exceptions';
import { AdminRole } from '@prisma/client';
import { MIN_PASSWORD_LENGTH } from 'src/constants/config';

export const checkCreateAdminRequirementsOrThrowError = (
  data: CreatedAdminDto,
) => {
  // Basic validations
  if (!data.name) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.NAME_REQUIRED,
    );
  }

  if (!data.email || !isValidEmail(data.email)) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.EMAIL_REQUIRED,
    );
  }

  if (!data.passwordHash || data.passwordHash.length <= MIN_PASSWORD_LENGTH) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.PASSWORD_REQUIRED,
    );
  }

  if (!data.role) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.ROLE_REQUIRED,
    );
  }
};

export const checkRoleRequirementsOrThrowError = (data: CreatedAdminDto) => {
  if (
    (data.role === AdminRole.CLIENT_OWNER ||
      data.role === AdminRole.CLIENT_ADMIN) &&
    !data.clientId
  ) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.CLIENT_ID_REQUIRED,
    );
  }

  if (data.role === AdminRole.UNITY_ADMIN && !data.unityIds?.length) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.UNITY_ID_REQUIRED,
    );
  }

  if (data.role === AdminRole.QUEUE_ADMIN && !data.queueIds?.length) {
    throw new CreateAdminBadRequestException(
      createAdminBadRequestExceptionMessages.QUEUE_ID_REQUIRED,
    );
  }
};
