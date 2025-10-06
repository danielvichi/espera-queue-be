import { isValidEmail } from './emailParser';

export const validateEmailOrThrow = (email: string) => {
  if (!email) {
    throw new Error('Email is required.');
  }

  if (!isValidEmail(email)) {
    throw new Error('Invalid email format.');
  }
};
