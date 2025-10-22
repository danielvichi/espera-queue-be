import { BadRequestException } from '@nestjs/common';

export const defaultQueueExceptionsMessage = {
  NAME_REQUIRED: 'Name is required.',
  CLIENT_ID_REQUIRED: 'Client Id is required.',
  UNITY_ID_REQUIRED: 'Unity Id is required.',
  TYPE_IS_REQUIRED: 'Queue Type is required.',
};

export class CreateQueueBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateQueueBadRequestException';
  }
}
