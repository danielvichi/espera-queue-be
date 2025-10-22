import { CreateUnityDto } from './unity.dto';
import {
  CreateUnityBadRequestException,
  createUnityBadRequestExceptionMessages,
  defaultUnityExceptionsMessages,
} from './unity.exceptions';

export function checkCreateUnityRequirementsOrThrowError(data: CreateUnityDto) {
  if (!data.name) {
    throw new CreateUnityBadRequestException(
      createUnityBadRequestExceptionMessages.NAME_REQUIRED,
    );
  }

  if (!data.clientId || data.clientId === '') {
    throw new CreateUnityBadRequestException(
      defaultUnityExceptionsMessages.CLIENT_ID_REQUIRED,
    );
  }
}
