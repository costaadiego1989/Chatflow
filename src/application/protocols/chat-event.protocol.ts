import { Result } from '../../helpers/result-helper';

export enum ChatEventType {
  USER_JOINED_ROOM = 'USER_JOINED_ROOM',
  USER_LEFT_ROOM = 'USER_LEFT_ROOM',
  MESSAGE_CREATED = 'MESSAGE_CREATED',
  MESSAGE_UPDATED = 'MESSAGE_UPDATED',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
}

export interface ChatEvent {
  type: ChatEventType;
  payload: any;
}

export interface UserRoomEventPayload {
  roomId: string;
  userId: string;
  username: string;
}

export interface MessageCreatedEventPayload {
  id: string;
  content: string;
  authorId: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface MessageDeletedEventPayload {
  id: string;
  roomId: string;
  authorId: string;
  deletedAt: Date;
}

export type MessageUpdatedEventPayload = MessageCreatedEventPayload;

export interface IChatEventService {
  emitUserJoinedRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void>;
  emitUserLeftRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void>;
  emitMessageCreated(message: MessageCreatedEventPayload): Result<void>;
  emitMessageUpdated(message: MessageUpdatedEventPayload): Result<void>;
  emitMessageDeleted(message: MessageDeletedEventPayload): Result<void>;
}
