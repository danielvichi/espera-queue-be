import { isValidEmail } from 'src/utils/emailParser';
import { CreateQueueUserDto } from './queue-user.dto';
import { BadRequestException } from '@nestjs/common';
import { defaultQueueUserExceptionsMessage } from './queue-user.exceptions';

export function checkCreateQueueUserRequirementsOrThrow(
  data: CreateQueueUserDto,
): void {
  if (!data.email) {
    throw new BadRequestException(
      defaultQueueUserExceptionsMessage.EMAIL_REQUIRED,
    );
  }

  if (data.email && !isValidEmail(data.email)) {
    throw new BadRequestException(
      defaultQueueUserExceptionsMessage.EMAIL_INVALID,
    );
  }

  if (!data.name) {
    throw new BadRequestException(
      defaultQueueUserExceptionsMessage.NAME_REQUIRED,
    );
  }

  if (!data.passwordHash) {
    throw new BadRequestException(
      defaultQueueUserExceptionsMessage.PASSWORD_HASH_REQUIRED,
    );
  }
}
