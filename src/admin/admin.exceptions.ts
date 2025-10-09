import { BadRequestException, ConflictException } from '@nestjs/common';

export const defaultAdminExceptionMessage = {
  EMAIL_NOT_FOUND: 'Admin with the provided email does not exist.',
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
};

export const createAdminBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a client.',
  EMAIL_REQUIRED: 'Valid Email is required to create a admin.',
  EMAIL_ALREADY_TAKEN: 'Email is already taken by another admin.',
  PASSWORD_REQUIRED: 'Password is required to create an admin.',
  OWNER_ID_REQUIRED:
    'Owner ID is required to create an Admin with Client Owner role.',
  OWNER_ALREADY_EXISTS: 'This client already has an owner.',
  CLIENT_ID_REQUIRED:
    'Client ID is required to create an Admin with Client Owner or Client Admin role.',
  UNITY_ID_REQUIRED:
    'At least one Unity ID is required to create an Admin with Unity Admin role.',
  QUEUE_ID_REQUIRED:
    'At least one Queue ID is required to create an Admin with Queue Admin role.',
  ROLE_REQUIRED: 'Role is required to create an admin.',
  RELATION_ID_REQUIRED:
    'At least one Queue Id or one Unity Id or one Client Id is required to create an Admin with Queue Admin role.',
  CLIENT_OWNER_CREATION: 'Unable to create Client Owner withing this endpoint',
};

export class CreateAdminBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateAdminBadRequestException';
  }
}

export class CreateAdminConflictException extends ConflictException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateAdminConflictException';
  }
}

export class GetAdminBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'GetAdminBadRequestException';
  }
}
