import { Socket } from 'socket.io';
import { AuthUser } from './chat-gateway.interface';

export interface IWebsocketAuthMiddleware {
  createIOServer(port: number, options?: any): any;
  extractTokenFromHeader(socket: Socket): string | undefined;
}

export interface ISocketWithAuth extends Socket {
  data: {
    user: AuthUser;
  };
}

export interface ITokenPayload {
  userId?: string;
  sub?: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}
