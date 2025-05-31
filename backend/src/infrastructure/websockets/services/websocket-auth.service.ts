import {
  Injectable,
  Logger,
  Socket,
  AuthInfo,
  IWebsocketAuthService,
  AUTH_MESSAGES,
  DEFAULT_VALUES,
} from '../imports/websocket-auth.service.imports';

@Injectable()
export class WebsocketAuthService implements IWebsocketAuthService {
  private readonly logger = new Logger(WebsocketAuthService.name);

  verifyAuthCredentials(client: Socket): AuthInfo | null {
    try {
      const authToken = this._extractAuthToken(client);
      if (!authToken) {
        this._logWarning(AUTH_MESSAGES.CONNECTION_WITHOUT_TOKEN(client.id));
        return null;
      }

      return this._createAuthInfo(client);
    } catch (error) {
      this._logError(AUTH_MESSAGES.ERROR_VERIFYING_AUTH(error.message));
      return null;
    }
  }

  private _extractAuthToken(client: Socket): string | undefined {
    return (
      client.handshake.headers.authorization || client.handshake.auth?.token
    );
  }

  private _createAuthInfo(client: Socket): AuthInfo {
    const userId = this._extractUserId(client);
    const username = this._extractUsername(client);
    return { userId, username };
  }

  private _extractUserId(client: Socket): string {
    return (client.handshake.query.userId as string) || DEFAULT_VALUES.USER_ID;
  }

  private _extractUsername(client: Socket): string {
    return (
      (client.handshake.query.username as string) || DEFAULT_VALUES.USERNAME
    );
  }

  private _logWarning(message: string): void {
    this.logger.warn(message);
  }

  private _logError(message: string): void {
    this.logger.error(message);
  }
}
