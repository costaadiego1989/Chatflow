import { Socket } from 'socket.io';

export interface AuthInfo {
  userId: string;
  username: string;
}

export interface IWebsocketAuthService {
  verifyAuthCredentials(client: Socket): AuthInfo | null;
}
