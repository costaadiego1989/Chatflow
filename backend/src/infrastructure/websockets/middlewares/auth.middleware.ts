import {
  IoAdapter,
  INestApplicationContext,
  Logger,
  Socket,
  JwtTokenService,
  AuthUser,
  IWebsocketAuthMiddleware,
  ITokenPayload,
  Result,
  ResultHelper,
  AUTH_ERROR_MESSAGES,
} from '../imports/auth-middleware.imports';

export class WebsocketAuthMiddleware
  extends IoAdapter
  implements IWebsocketAuthMiddleware
{
  private readonly jwtService: JwtTokenService;
  private readonly logger = new Logger(WebsocketAuthMiddleware.name);

  constructor(
    private app: INestApplicationContext,
    jwtService?: JwtTokenService,
  ) {
    super(app);
    this.jwtService = jwtService || this.app.get(JwtTokenService);
  }

  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    server.use(async (socket: Socket, next) => {
      try {
        const authResult = await this._authenticateClient(socket);
        if (!authResult.success) {
          return next(new Error(authResult.error));
        }
        socket.data.user = authResult.data;
        next();
      } catch (error) {
        const errorResult = this._handleError('socketAuthentication', error);
        next(ResultHelper.failure(errorResult.error));
      }
    });
    return server;
  }

  extractTokenFromHeader(socket: Socket): string | undefined {
    if (socket.handshake?.auth?.token) {
      return socket.handshake.auth.token;
    }
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (socket.handshake.query && socket.handshake.query.token) {
      return socket.handshake.query.token as string;
    }
    return undefined;
  }

  private async _authenticateClient(socket: Socket): Promise<Result<AuthUser>> {
    const token = this.extractTokenFromHeader(socket);
    const payload = this._decodeToken(token);
    const validateResult = await this._validateAuthenticateClientData(
      token,
      payload,
    );
    if (!validateResult.success) {
      return ResultHelper.failure(validateResult.error);
    }
    const validatedPayload = validateResult.data;
    const user: AuthUser = {
      userId: validatedPayload.userId,
      username: validatedPayload.username,
      email: validatedPayload.email,
      token: token,
    };
    this.logger.log(`Usuário autenticado: ${user.username} (${user.userId})`);
    return ResultHelper.success(user);
  }

  private async _validateAuthenticateClientData(
    token: string,
    payload: ITokenPayload,
  ): Promise<Result<ITokenPayload>> {
    if (!token) {
      return { success: false, error: AUTH_ERROR_MESSAGES.TOKEN_REQUIRED };
    }
    const verifyResult = await this.jwtService.validateToken(token);
    if (!verifyResult.success) {
      return { success: false, error: AUTH_ERROR_MESSAGES.TOKEN_INVALID };
    }
    if (!payload || (!payload.userId && !payload.sub)) {
      return ResultHelper.failure(AUTH_ERROR_MESSAGES.TOKEN_MALFORMED);
    }
    const updatedPayload = {
      userId: payload.userId || payload.sub,
      username: payload.username || 'anonymous',
      email: payload.email || 'anonymous@example.com',
      iat: payload.iat,
      exp: payload.exp,
    };
    return ResultHelper.success(updatedPayload);
  }

  private _decodeToken(token: string): ITokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const userId = payload.sub || payload.userId;
      return {
        userId,
        sub: payload.sub,
        username: payload.username || 'anonymous',
        email: payload.email || 'anonymous@example.com',
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      this._handleError('decodeToken', error);
      return null;
    }
  }

  private _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(`Error in ${operation}: ${error.message}`);
    return ResultHelper.failure(AUTH_ERROR_MESSAGES.INTERNAL_ERROR);
  }
}
