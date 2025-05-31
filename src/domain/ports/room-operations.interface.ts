import { Socket } from 'socket.io';
import { Result } from '../../helpers/result-helper';
import { MessageData } from './message-repository.interface';

export interface IRoomOperationsService {
  joinRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void>;

  leaveRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void>;

  sendMessage(roomId: string, message: any): Promise<Result<void>>;

  getRoomMessages(
    roomId: string,
    limit?: number,
    offset?: number,
  ): Promise<Result<MessageData[]>>;

  updateMessage(
    messageId: string,
    content: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<MessageData>>;

  deleteMessage(
    messageId: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<MessageData>>;
}
