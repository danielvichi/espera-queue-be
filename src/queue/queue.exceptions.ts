import { BadRequestException, MethodNotAllowedException } from '@nestjs/common';

export const defaultQueueExceptionsMessage = {
  NAME_REQUIRED: 'Name is required.',
  CLIENT_ID_REQUIRED: 'Client Id is required.',
  UNITY_ID_REQUIRED: 'Unity Id is required.',
  TYPE_IS_REQUIRED: 'Queue Type is required.',
  QUEUE_ID_REQUIRED: 'Queue Id is required',
  PAYLOAD_REQUIRED: 'Payload is required',
  QUEUE_NOT_FOUND: 'Queue not found',
};

export class CreateQueueBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateQueueBadRequestException';
  }
}

export class QueueMethodNotAllowedException extends MethodNotAllowedException {
  constructor(message: { adminId: string; adminName: string }) {
    super({
      error: 'QueueMethodNotAllowedException',
      message: `Method not allowed for Admin ${message.adminName} of id - ${message.adminId}`,
    });
  }
}
