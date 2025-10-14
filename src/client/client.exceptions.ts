import { BadRequestException, NotFoundException } from '@nestjs/common';

export const createClientBadRequestExceptionMessages = {
  NAME_REQUIRED: 'Name is required to create a client.',
  OWNER_ID_REQUIRED: 'Owner ID is required to create a client.',
  CLIENT_WITH_SAME_OWNER_ID_EXISTS:
    'Client with the same owner ID already exists.',
  CLIENT_ADMIN_NAME_REQUIRED: 'Admin name is required to create a client',
  PASSWORD_REQUIRED: 'A passwordHash is required to create a client',
  EMAIL_REQUIRED: 'A Valid Email is required to create a client',
  SOMETHING_WENT_WRONG:
    'Something went wrong when creating a client account please try again',
};

export class CreateClientBadRequestException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'CreateClientBadRequestException';
  }
}

export class ClientNotFoundException extends NotFoundException {
  constructor(clientId: string) {
    super(`Client with ID ${clientId} not found.`);
    this.name = 'ClientNotFoundException';
  }
}
