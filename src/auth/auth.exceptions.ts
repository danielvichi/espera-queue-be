export const defaultAuthExceptionMessage = {
  INVALID_CREDENTIALS: 'Invalid credentials provided.',
  PASSWORD_REQUIRED: 'Password is required',
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
