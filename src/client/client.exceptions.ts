import { BadRequestException } from '@nestjs/common';

export const createClientBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a client.',
  EMAIL_REQUIRED: 'Email is required to create a client.',
  PASSWORD_HASH_REQUIRED: 'PasswordHash is required to create a client.',
};

export class CreateClientBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateClientBadRequestException';
  }
}

export class ClientNotFoundException extends BadRequestException {
  constructor(clientId: string) {
    super(`Client with ID ${clientId} not found.`);
    this.name = 'ClientNotFoundException';
  }
}
