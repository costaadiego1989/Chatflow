import { Result } from '../../helpers/result-helper';
import { Socket } from 'socket.io';

export interface IChatGateway {
  handleConnection(client: Socket): void;
  handleDisconnect(client: Socket): void;
  joinRoom(client: Socket, roomId: string): Result<void>;
  leaveRoom(client: Socket, roomId: string): Result<void>;
  sendMessage(roomId: string, message: any): Promise<Result<void>>;
  notifyUserJoinedRoom(roomId: string, userId: string): Result<void>;
  notifyUserLeftRoom(roomId: string, userId: string): Result<void>;
  notifyMessageCreated(roomId: string, message: any): Result<void>;
  notifyMessageUpdated(roomId: string, message: any): Result<void>;
  notifyMessageDeleted(roomId: string, messageId: string): Result<void>;
}
