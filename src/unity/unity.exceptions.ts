import { BadRequestException, NotFoundException } from '@nestjs/common';

export const createUnityBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a Unity.',
  CLIENT_NOT_FOUND: 'Client Id not found',
  SOMETHING_WENT_WRONG:
    'Something went wrong when creating an Unity account please try again',
};

export const updateUnityExceptionMessages = {
  UNITY_ALREADY_DISABLED: 'Unity already disabled',
  UNITY_ALREADY_ENABLED: 'Unity already enabled',
  PAYLOAD_REQUIRED: 'Payload data is required',
};

export const defaultUnityExceptionsMessages = {
  UNITY_ID_REQUIRED: 'Unity Id is required',
  CLIENT_ID_REQUIRED: 'Client Id is required',
};
export class CreateUnityBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateUnityBadRequestException';
  }
}

export class UnityNotFoundException extends NotFoundException {
  constructor(clientId: string) {
    super(`Unity with ID ${clientId} not found.`);
    this.name = 'UnityNotFoundException';
  }
}
