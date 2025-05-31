import {
  Injectable,
  Logger,
  Socket,
  IRoomOperationsService,
  ChatEventService,
  ClientManagerService,
  Result,
  ResultHelper,
  MessageRepository,
  MessageData,
  ROOM_LOG_MESSAGES,
} from '../imports/room-operations.service.imports';

@Injectable()
export class RoomOperationsService implements IRoomOperationsService {
  private readonly logger = new Logger(RoomOperationsService.name);
  private readonly inMemoryMessages = new Map<string, any[]>();

  constructor(
    private readonly chatEventService: ChatEventService,
    private readonly clientManagerService: ClientManagerService,
    private readonly messageRepository: MessageRepository,
  ) {}

  joinRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    try {
      this.logger.log(ROOM_LOG_MESSAGES.USER_JOINING(userId, roomId));
      if (!client) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.CLIENT_REQUIRED);
      }
      if (!roomId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.ROOM_ID_REQUIRED);
      }
      this._performJoinRoom(client, roomId);
      const joinResult = this._registerClientInRoom(client.id, roomId);
      if (!joinResult.success) {
        return ResultHelper.failure(joinResult.error);
      }
      const notifyResult = this._notifyUserJoinedRoom(roomId, userId, username);
      if (!notifyResult.success) {
        return ResultHelper.failure(notifyResult.error);
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('joinRoom', error);
    }
  }

  leaveRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    try {
      this.logger.log(ROOM_LOG_MESSAGES.USER_LEAVING(userId, roomId));
      if (!client) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.CLIENT_REQUIRED);
      }
      if (!roomId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.ROOM_ID_REQUIRED);
      }
      this._performLeaveRoom(client, roomId);
      const leaveResult = this._unregisterClientFromRoom(client.id, roomId);
      if (!leaveResult.success) {
        return ResultHelper.failure(leaveResult.error);
      }
      const notifyResult = this._notifyUserLeftRoom(roomId, userId, username);
      if (!notifyResult.success) {
        return ResultHelper.failure(notifyResult.error);
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('leaveRoom', error);
    }
  }

  async sendMessage(roomId: string, message: any): Promise<Result<void>> {
    try {
      this.logger.log(ROOM_LOG_MESSAGES.SENDING_MESSAGE(roomId));
      if (!roomId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.ROOM_ID_REQUIRED);
      }
      if (!message || !message.content || !message.authorId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.INVALID_MESSAGE);
      }
      const createResult = await this._createMessage(message, roomId);
      if (!createResult.success) {
        return ResultHelper.failure(
          ROOM_LOG_MESSAGES.FAILED_CREATE_MESSAGE(createResult.error),
        );
      }
      const persistedMessage = createResult.data;
      this._storeInMemoryMessage(roomId, persistedMessage);
      const notifyResult = this._notifyMessageCreated(persistedMessage);
      if (!notifyResult.success) {
        return ResultHelper.failure(notifyResult.error);
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('sendMessage', error);
    }
  }

  async getRoomMessages(
    roomId: string,
    limit = 50,
    offset = 0,
  ): Promise<Result<MessageData[]>> {
    try {
      this.logger.log(ROOM_LOG_MESSAGES.FETCHING_MESSAGES(roomId));
      if (!roomId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.ROOM_ID_REQUIRED);
      }
      const messagesResult = await this._findMessagesByRoomId(
        roomId,
        limit,
        offset,
      );
      if (!messagesResult.success) {
        return ResultHelper.failure(
          ROOM_LOG_MESSAGES.FAILED_FETCH_MESSAGES(messagesResult.error),
        );
      }
      return ResultHelper.success(messagesResult.data);
    } catch (error) {
      return this._handleError('getRoomMessages', error);
    }
  }
  async updateMessage(
    messageId: string,
    content: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<MessageData>> {
    try {
      if (!messageId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.MESSAGE_ID_REQUIRED);
      }
      if (!content) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.CONTENT_REQUIRED);
      }
      if (!roomId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.ROOM_ID_REQUIRED);
      }
      if (!authorId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.USER_ID_REQUIRED);
      }
      const messageResult = await this.messageRepository.findById(messageId);
      if (!messageResult.success || !messageResult.data) {
        return ResultHelper.failure(
          `${ROOM_LOG_MESSAGES.MESSAGE_NOT_FOUND}: ${messageResult.error}`,
        );
      }
      const message = messageResult.data;
      if (message.userId !== authorId) {
        return ResultHelper.failure(
          ROOM_LOG_MESSAGES.UNAUTHORIZED_TO_UPDATE_MESSAGE,
        );
      }
      const updateResult = await this.messageRepository.update(messageId, {
        content,
        editedAt: new Date(),
      });
      return updateResult;
    } catch (error) {
      return this._handleError('updateMessage', error);
    }
  }

  async deleteMessage(
    messageId: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<MessageData>> {
    try {
      if (!messageId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.MESSAGE_ID_REQUIRED);
      }
      if (!roomId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.ROOM_ID_REQUIRED);
      }
      if (!authorId) {
        return ResultHelper.failure(ROOM_LOG_MESSAGES.USER_ID_REQUIRED);
      }
      const messageResult = await this.messageRepository.findById(messageId);
      if (!messageResult.success || !messageResult.data) {
        return ResultHelper.failure(
          `${ROOM_LOG_MESSAGES.MESSAGE_NOT_FOUND}: ${messageResult.error}`,
        );
      }
      const message = messageResult.data;
      if (message.userId !== authorId) {
        return ResultHelper.failure(
          ROOM_LOG_MESSAGES.UNAUTHORIZED_TO_DELETE_MESSAGE,
        );
      }
      const deleteResult = await this.messageRepository.delete(messageId);
      return deleteResult;
    } catch (error) {
      return this._handleError('deleteMessage', error);
    }
  }

  private async _createMessage(
    message: any,
    roomId: string,
  ): Promise<Result<MessageData>> {
    const result = await this.messageRepository.create({
      content: message.content,
      userId: message.authorId,
      roomId,
      type: message.type || 'TEXT',
      mediaUrl: message.mediaUrl,
      linkPreview: message.linkPreview,
      replyToId: message.replyToId,
    });
    return result;
  }

  private _findMessagesByRoomId(
    roomId: string,
    limit = 50,
    offset = 0,
  ): Promise<Result<MessageData[]>> {
    const result = this.messageRepository.findByRoomId(roomId, limit, offset);
    return result;
  }

  private _performJoinRoom(client: Socket, roomId: string): void {
    client.join(roomId);
  }

  private _performLeaveRoom(client: Socket, roomId: string): void {
    client.leave(roomId);
  }

  private _registerClientInRoom(
    clientId: string,
    roomId: string,
  ): Result<boolean> {
    const result = this.clientManagerService.joinRoom(clientId, roomId);
    if (!result.success) {
      return ResultHelper.failure(result.error);
    }
    return ResultHelper.success(true);
  }

  private _unregisterClientFromRoom(
    clientId: string,
    roomId: string,
  ): Result<boolean> {
    const result = this.clientManagerService.leaveRoom(clientId, roomId);
    if (!result.success) {
      return ResultHelper.failure(result.error);
    }
    return ResultHelper.success(true);
  }

  private _notifyUserJoinedRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    const result = this.chatEventService.emitUserJoinedRoom(
      roomId,
      userId,
      username,
    );
    if (!result.success) {
      return ResultHelper.failure(result.error);
    }
    return ResultHelper.success();
  }

  private _notifyUserLeftRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    const result = this.chatEventService.emitUserLeftRoom(
      roomId,
      userId,
      username,
    );
    if (!result.success) {
      return ResultHelper.failure(result.error);
    }
    return ResultHelper.success();
  }

  private _notifyMessageCreated(messageData: any): Result<void> {
    const result = this.chatEventService.emitMessageCreated(messageData);
    if (!result.success) {
      return ResultHelper.failure(result.error);
    }
    return ResultHelper.success();
  }

  private _storeInMemoryMessage(roomId: string, message: any): void {
    if (!this.inMemoryMessages.has(roomId)) {
      this.inMemoryMessages.set(roomId, []);
    }
    this.inMemoryMessages.get(roomId).push(message);
  }

  private _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(
      ROOM_LOG_MESSAGES.ERROR_OPERATION(operation, error.message),
    );
    return ResultHelper.failure(error.message);
  }
}
