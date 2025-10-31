import { ConflictException, NotFoundException } from '@nestjs/common';

export const defaultQueueInstanceExceptionsMessage = {
  QUEUE_NOT_FOUND: 'Queue not found',
  QUEUE_INSTANCE_ALREADY_CREATED: 'A Queue Instance is already created.',
  USER_NOT_FOUND: 'User not found',
  QUEUE_INSTANCE_ID_REQUIRED: 'Queue Instance Id is required',
};

export class QueueInstanceNotFoundException extends NotFoundException {
  constructor(queueInstanceId: string) {
    super({
      error: 'QueueInstanceNotFoundException',
      message: `Queue Instance with id - ${queueInstanceId} not found`,
    });
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(user: string) {
    super({
      error: 'UserNotFoundException',
      message: `User with id - ${user} not found`,
    });
  }
}

export class UserAlreadyInQueueException extends ConflictException {
  constructor(data: { userId: string; queueInstanceId: string }) {
    super({
      error: 'UserAlreadyInQueueException',
      message: `User with id - ${data.userId} is already in Queue Instance with id - ${data.queueInstanceId}`,
    });
  }
}
