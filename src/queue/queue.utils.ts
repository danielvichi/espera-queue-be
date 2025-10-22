import { CreateQueueDto } from './queue.dto';
import {
  CreateQueueBadRequestException,
  defaultQueueExceptionsMessage,
} from './queue.exceptions';

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
