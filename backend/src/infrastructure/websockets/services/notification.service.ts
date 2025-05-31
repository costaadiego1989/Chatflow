import {
  Injectable,
  Logger,
  Server,
  INotificationService,
  ChatEvents,
  ResultHelper,
  NOTIFICATION_MESSAGES,
} from '../imports/notification.service.imports';

@Injectable()
export class NotificationService implements INotificationService {
  private server: Server;
  private readonly logger = new Logger(NotificationService.name);

  setServer(server: Server): void {
    this.server = server;
  }

  notifyUserJoinedRoom(roomId: string, userId: string): void {
    try {
      this._validateServerInstance();
      this._emitToRoom(roomId, ChatEvents.USER_JOINED_ROOM, {
        roomId,
        userId,
      });
    } catch (error) {
      this._handleError(ChatEvents.USER_JOINED_ROOM, error);
    }
  }

  notifyUserLeftRoom(roomId: string, userId: string): void {
    try {
      this._validateServerInstance();
      this._emitToRoom(roomId, ChatEvents.USER_LEFT_ROOM, {
        roomId,
        userId,
      });
    } catch (error) {
      this._handleError(ChatEvents.USER_LEFT_ROOM, error);
    }
  }

  notifyMessageCreated(roomId: string, message: any): void {
    try {
      this._validateServerInstance();
      this._emitToRoom(roomId, ChatEvents.MESSAGE_RECEIVED, message);
    } catch (error) {
      this._handleError(ChatEvents.MESSAGE_RECEIVED, error);
    }
  }

  notifyMessageUpdated(roomId: string, message: any): void {
    try {
      this._validateServerInstance();
      this._emitToRoom(roomId, ChatEvents.MESSAGE_UPDATED, message);
    } catch (error) {
      this._handleError(ChatEvents.MESSAGE_UPDATED, error);
    }
  }

  notifyMessageDeleted(roomId: string, messageId: string): void {
    try {
      this._validateServerInstance();
      this._emitToRoom(roomId, ChatEvents.MESSAGE_DELETED, {
        roomId,
        messageId,
      });
    } catch (error) {
      this._handleError(ChatEvents.MESSAGE_DELETED, error);
    }
  }

  private _validateServerInstance(): void {
    if (!this.server) {
      throw new Error(NOTIFICATION_MESSAGES.SERVER_NOT_SET);
    }
  }

  private _emitToRoom(roomId: string, event: string, data: any): void {
    this.server.to(roomId).emit(event, data);
  }

  private _handleError(event: string, error: Error): void {
    this.logger.error(
      NOTIFICATION_MESSAGES.ERROR_NOTIFYING(event, error.message),
    );
    ResultHelper.failure(error.message);
  }
}
