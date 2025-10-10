import { BadRequestException, NotFoundException } from '@nestjs/common';

export const defaultAuthExceptionMessage = {
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  PASSWORD_REQUIRED: 'Password is required',
  USER_NOT_FOUNDED: 'Could not find user',
};

export class UserNotFoundException extends NotFoundException {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundException';
  }
}

export class InvalidCredentialsException extends BadRequestException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCredentialsException';
  }
}
