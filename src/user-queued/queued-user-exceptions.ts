import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const defaultQueueUserExceptionsMessage = {
  USER_ID_REQUIRED: 'User Id is required',
  QUEUE_ID_REQUIRED: 'Queue Id is required',
  VALID_NUMBER_OF_SEATS_REQUIRED: 'A valid number of seats is required',
  OUTSIDE_QUEUE_WORKING_HOURS: 'Outside Queue working hours',
  QUEUE_NOT_FOUND: 'Queue not found',
  USER_ALREADY_QUEUED:
    'User is already queued for this Queue with Waiting status',
};

export class QueuedUserBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'QueuedUserBadRequestException';
  }
}

export class QueuedUserNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message);
    this.name = 'QueuedUserNotFoundException';
  }
}

export class QueuedUserConflictException extends ConflictException {
  constructor(message: string) {
    super(message);
    this.name = 'QueuedUserConflictException';
  }
}

export class QueuedUserForbiddenException extends ForbiddenException {
  constructor(message: string) {
    super(message);
    this.name = 'QueuedUserForbiddenException';
  }
}
