import { isValidEmail } from 'src/utils/emailParser';
import { CreateClientWithAdminDto } from './client.dto';
import {
  CreateClientBadRequestException,
  createClientBadRequestExceptionMessages,
} from './client.exceptions';

export const checkCreateClientWithAdminRequirementsOrThrowError = (
  data: CreateClientWithAdminDto,
) => {
  if (!data.name) {
    throw new CreateClientBadRequestException(
      createClientBadRequestExceptionMessages.NAME_REQUIRED,
    );
  }

  if (!data.admin.name) {
    throw new CreateClientBadRequestException(
      createClientBadRequestExceptionMessages.CLIENT_ADMIN_NAME_REQUIRED,
    );
  }

  if (!data.admin.passwordHash) {
    throw new CreateClientBadRequestException(
      createClientBadRequestExceptionMessages.PASSWORD_REQUIRED,
    );
  }

  if (!data.admin.email || !isValidEmail(data.admin.email)) {
    throw new CreateClientBadRequestException(
      createClientBadRequestExceptionMessages.EMAIL_REQUIRED,
    );
  }
};
