import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  ChatEvent,
  ChatEventType,
  UserRoomEventPayload,
  MessageCreatedEventPayload,
  MessageUpdatedEventPayload,
  MessageDeletedEventPayload,
  IChatEventService,
} from '../protocols/chat-event.protocol';
import { ResultHelper, Result } from '../../helpers/result-helper';

const EVENT_MESSAGES = {
  ERROR_EMIT: (event: string, error: string) =>
    `Error emitting ${event} event: ${error}`,
};

@Injectable()
export class ChatEventService implements IChatEventService {
  private _eventSubject = new Subject<ChatEvent>();
  public events$ = this._eventSubject.asObservable();
  private readonly logger = new Logger(ChatEventService.name);

  emitUserJoinedRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    try {
      const payload: UserRoomEventPayload = { roomId, userId, username };
      this._eventSubject.next({
        type: ChatEventType.USER_JOINED_ROOM,
        payload,
      });
      return ResultHelper.success();
    } catch (error) {
      return this._handleError(ChatEventType.USER_JOINED_ROOM, error);
    }
  }

  emitUserLeftRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    try {
      const payload: UserRoomEventPayload = { roomId, userId, username };
      this._eventSubject.next({
        type: ChatEventType.USER_LEFT_ROOM,
        payload,
      });
      return ResultHelper.success();
    } catch (error) {
      return this._handleError(ChatEventType.USER_LEFT_ROOM, error);
    }
  }

  emitMessageCreated(message: MessageCreatedEventPayload): Result<void> {
    try {
      this._eventSubject.next({
        type: ChatEventType.MESSAGE_CREATED,
        payload: message,
      });
      return ResultHelper.success();
    } catch (error) {
      return this._handleError(ChatEventType.MESSAGE_CREATED, error);
    }
  }

  emitMessageUpdated(message: MessageUpdatedEventPayload): Result<void> {
    try {
      this._eventSubject.next({
        type: ChatEventType.MESSAGE_UPDATED,
        payload: message,
      });
      return ResultHelper.success();
    } catch (error) {
      return this._handleError(ChatEventType.MESSAGE_UPDATED, error);
    }
  }

  emitMessageDeleted(message: MessageDeletedEventPayload): Result<void> {
    try {
      this._eventSubject.next({
        type: ChatEventType.MESSAGE_DELETED,
        payload: message,
      });
      return ResultHelper.success();
    } catch (error) {
      return this._handleError(ChatEventType.MESSAGE_DELETED, error);
    }
  }

  private _handleError(event: ChatEventType, error: Error): Result<void> {
    const errorMessage = EVENT_MESSAGES.ERROR_EMIT(event, error.message);
    this.logger.error(errorMessage);
    return ResultHelper.failure(errorMessage);
  }
}
