import { CreateUnityDto } from './unity.dto';
import {
  CreateUnityBadRequestException,
  createUnityBadRequestExceptionMessages,
} from './unity.exceptions';

export function checkCreateUnityRequirementsOrThrowError(data: CreateUnityDto) {
  if (!data.name) {
    throw new CreateUnityBadRequestException(
      createUnityBadRequestExceptionMessages.NAME_REQUIRED,
    );
  }

  if (!data.clientId || data.clientId === '') {
    throw new CreateUnityBadRequestException(
      createUnityBadRequestExceptionMessages.CLIENT_ID_REQUIRED,
    );
  }
}
