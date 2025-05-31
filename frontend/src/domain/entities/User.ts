export class User {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password?: string,
    public readonly id?: string,
    public readonly token?: string
  ) {}
} 