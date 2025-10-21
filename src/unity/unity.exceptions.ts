import { BadRequestException, NotFoundException } from '@nestjs/common';

export const createUnityBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a client.',
  CLIENT_ID_REQUIRED: 'Client Id is required',
  CLIENT_NOT_FOUND: 'Client Id not found',
  SOMETHING_WENT_WRONG:
    'Something went wrong when creating a client account please try again',
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
