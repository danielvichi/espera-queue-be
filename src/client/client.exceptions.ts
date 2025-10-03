import { BadRequestException } from '@nestjs/common';

export const createClientBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a client.',
  OWNER_ID_REQUIRED: 'Owner ID is required to create a client.',
  CLIENT_WITH_SAME_OWNER_ID_EXISTS:
    'Client with the same owner ID already exists.',
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
