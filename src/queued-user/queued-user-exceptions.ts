import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export const defaultQueueUserExceptionsMessage = {
  USER_ID_REQUIRED: 'User Id is required',
  INVALID_USER_ID: 'Invalid User Id',
  INVALID_QUEUE_ID: 'Invalid Queue Id',
  QUEUE_ID_REQUIRED: 'Queue Id is required',
  QUEUED_USER_ID_REQUIRED: 'Queued User Id is required',
  VALID_NUMBER_OF_SEATS_REQUIRED: 'A valid number of seats is required',
  OUTSIDE_QUEUE_WORKING_HOURS: 'Outside Queue working hours',
  QUEUE_NOT_FOUND: 'Queue not found',
  QUEUED_USER_ENTRY_NOT_FOUND: 'Queued user entry not found',
  USER_ALREADY_QUEUED:
    'User is already queued for this Queue with Waiting status',
  USER_CANNOT_BE_SERVED:
    'User cannot be served as they are not in Waiting status',
  ADMIN_PRIVILEGE_REQUIRED: 'Admin privilege is required',
  CLIENT_ADMIN_PRIVILEGE_REQUIRED: 'Client admin privilege is required',
  UNITY_ADMIN_PRIVILEGE_REQUIRED: 'Unity admin privilege is required',
  QUEUE_ADMIN_PRIVILEGE_REQUIRED: 'Queue Admin privileges is required',
  USER_ROLE_REQUIRED: 'User role is required',
};

export class QueuedUserBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'QueuedUserBadRequestException';
  }
}

export class QueuedUserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(userId);
    this.name = 'QueuedUserNotFoundException';
    this.message = `QueuedUser with ID ${userId} not found`;
  }
}
export class QueueNotFoundException extends NotFoundException {
  constructor(queueId: string) {
    super(queueId);
    this.name = 'QueueNotFoundException';
    this.message = `Queue with ID ${queueId} not found`;
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
