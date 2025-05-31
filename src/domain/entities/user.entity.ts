export class User {
  private readonly _id: string;
  private _email: string;
  private _username: string;
  private _password: string;
  private _status: string;
  private _avatar?: string;
  private _lastSeen: Date;

  constructor(id: string, email: string, username: string, password: string) {
    this._id = id;
    this._email = email;
    this._username = username;
    this._password = password;
    this._status = 'offline';
    this._lastSeen = new Date();

    this._validate();
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  setEmail(email: string): void {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email');
    }
    this._email = email;
  }

  get username(): string {
    return this._username;
  }

  setUsername(username: string): void {
    if (!username || username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }
    this._username = username;
  }

  get password(): string {
    return this._password;
  }

  setPassword(password: string): void {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    this._password = password;
  }

  get status(): string {
    return this._status;
  }

  set status(status: string) {
    this._status = status;
    if (status === 'online') {
      this._lastSeen = new Date();
    }
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  set avatar(avatarUrl: string | undefined) {
    this._avatar = avatarUrl;
  }

  get lastSeen(): Date {
    return this._lastSeen;
  }

  goOnline(): void {
    this._status = 'online';
    this._lastSeen = new Date();
  }

  goOffline(): void {
    this._status = 'offline';
    this._lastSeen = new Date();
  }

  private _validate(): void {
    if (!this._email || !this._email.includes('@')) {
      throw new Error('Invalid email');
    }

    if (!this._username || this._username.length < 3) {
      throw new Error('Username must be at least 3 characters long');
    }

    if (!this._password || this._password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }
}
