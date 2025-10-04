import { BadRequestException } from '@nestjs/common';

export const createAdminBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a client.',
  EMAIL_REQUIRED: 'Valid Email is required to create a admin.',
  EMAIL_ALREADY_TOKEN: 'Email is already taken by another admin.',
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
};

export class CreateAdminBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateAdminBadRequestException';
  }
}
