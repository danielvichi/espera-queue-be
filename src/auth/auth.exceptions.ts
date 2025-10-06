export const defaultAuthExceptionMessage = {
  EMAIL_NOT_FOUND: 'User with the provided email does not exist.',
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
};

export class AdminSignIn extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundException';
  }
}

export class InvalidCredentialsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCredentialsException';
  }
}
