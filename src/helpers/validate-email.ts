import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidateEmail {
  readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }
}
