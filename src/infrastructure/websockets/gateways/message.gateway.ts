import {
  Injectable,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  Server,
  Socket,
  ChatEvents,
  UpdateMessagePayload,
  DeleteMessagePayload,
  Result,
  ResultHelper,
  ChatOrchestrationService,
  MessageData,
  BaseGateway,
  MESSAGE_ERRORS,
  MESSAGE_LOG_MESSAGES,
} from '../imports/message.gateway.imports';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessageGateway extends BaseGateway {
  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly chatOrchestrationService: ChatOrchestrationService,
  ) {
    super(chatOrchestrationService, MessageGateway.name);
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string },
  ): Promise<void> {
    try {
      if (!this._validateSendMessagePayload(client, payload)) {
        return;
      }

      const clientData = this._validateClientAccess(client, payload.roomId);
      if (!clientData) return;

      const message: MessageData = {
        content: payload.content,
        authorId: clientData.userId,
      };
      const result = await this.sendMessage(payload.roomId, message);
      if (!result.success) {
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleSendMessage', error);
    }
  }

  @SubscribeMessage(ChatEvents.UPDATE_MESSAGE)
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: UpdateMessagePayload,
  ): Promise<void> {
    try {
      if (!this._validateUpdateMessagePayload(client, payload)) {
        return;
      }

      const clientData = this._validateClientAccess(client, payload.roomId);
      if (!clientData) return;

      if (
        !this._validateMessageOwnership(
          client,
          clientData.userId,
          payload.authorId,
          MESSAGE_ERRORS.EDIT_OWN_MESSAGES_ONLY,
        )
      ) {
        return;
      }

      const result = await this.updateMessage(
        payload.messageId,
        payload.content,
        payload.roomId,
        payload.authorId,
      );
      if (!result.success) {
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleUpdateMessage', error);
    }
  }

  @SubscribeMessage(ChatEvents.DELETE_MESSAGE)
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DeleteMessagePayload,
  ): Promise<void> {
    try {
      if (!this._validateDeleteMessagePayload(client, payload)) {
        return;
      }

      const clientData = this._validateClientAccess(client, payload.roomId);
      if (!clientData) return;

      if (
        !this._validateMessageOwnership(
          client,
          clientData.userId,
          payload.authorId,
          MESSAGE_ERRORS.DELETE_OWN_MESSAGES_ONLY,
        )
      ) {
        return;
      }

      const result = await this.deleteMessage(
        payload.messageId,
        payload.roomId,
        payload.authorId,
      );
      if (!result.success) {
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleDeleteMessage', error);
    }
  }

  async sendMessage(
    roomId: string,
    message: MessageData,
  ): Promise<Result<void>> {
    try {
      if (!roomId) {
        return ResultHelper.failure(MESSAGE_ERRORS.ROOM_REQUIRED);
      }
      if (!message || !message.content || !message.authorId) {
        return ResultHelper.failure(MESSAGE_ERRORS.INVALID_MESSAGE);
      }
      this.logger.log(MESSAGE_LOG_MESSAGES.SENDING_MESSAGE(roomId));
      return await this.chatOrchestrationService.processClientSendMessage(
        roomId,
        message,
      );
    } catch (error) {
      return this.handleOperationError('sendMessage', error);
    }
  }

  async updateMessage(
    messageId: string,
    content: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<void>> {
    try {
      if (!this._validateMessageParameters(messageId, content, roomId)) {
        return ResultHelper.failure(MESSAGE_ERRORS.INVALID_MESSAGE);
      }
      this.logger.log(MESSAGE_LOG_MESSAGES.UPDATING_MESSAGE(messageId, roomId));
      return await this.chatOrchestrationService.processMessageUpdate(
        messageId,
        content,
        roomId,
        authorId,
      );
    } catch (error) {
      return this.handleOperationError('updateMessage', error);
    }
  }

  async deleteMessage(
    messageId: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<void>> {
    try {
      if (!messageId) {
        return ResultHelper.failure(MESSAGE_ERRORS.MESSAGE_ID_REQUIRED);
      }
      if (!roomId) {
        return ResultHelper.failure(MESSAGE_ERRORS.ROOM_REQUIRED);
      }
      this.logger.log(MESSAGE_LOG_MESSAGES.DELETING_MESSAGE(messageId, roomId));
      return await this.chatOrchestrationService.processMessageDelete(
        messageId,
        roomId,
        authorId,
      );
    } catch (error) {
      return this.handleOperationError('deleteMessage', error);
    }
  }

  notifyMessageCreated(roomId: string, message: MessageData): Result<void> {
    return this.emitEventToRoom(
      roomId,
      ChatEvents.MESSAGE_RECEIVED,
      message,
      'notifyMessageCreated',
      MESSAGE_ERRORS.ROOM_REQUIRED,
      MESSAGE_ERRORS.MESSAGE_REQUIRED,
    );
  }

  notifyMessageUpdated(roomId: string, message: MessageData): Result<void> {
    return this.emitEventToRoom(
      roomId,
      ChatEvents.MESSAGE_UPDATED,
      message,
      'notifyMessageUpdated',
      MESSAGE_ERRORS.ROOM_REQUIRED,
      MESSAGE_ERRORS.MESSAGE_REQUIRED,
    );
  }

  notifyMessageDeleted(
    roomId: string,
    messageId: string,
    authorId: string,
    deletedAt: Date,
  ): Result<void> {
    return this.emitEventToRoom(
      roomId,
      ChatEvents.MESSAGE_DELETED,
      { id: messageId, roomId, authorId, deletedAt },
      'notifyMessageDeleted',
      MESSAGE_ERRORS.ROOM_REQUIRED,
      MESSAGE_ERRORS.MESSAGE_REQUIRED,
    );
  }

  protected _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(`Error in ${operation}: ${error.message}`);
    return ResultHelper.failure(MESSAGE_ERRORS.FAILED_NOTIFICATION);
  }

  private _validateSendMessagePayload(
    client: Socket,
    payload: { roomId: string; content: string },
  ): boolean {
    if (!payload.roomId) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_ROOM_ID);
      return false;
    }
    if (!payload.content) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_CONTENT);
      return false;
    }
    return true;
  }

  private _validateUpdateMessagePayload(
    client: Socket,
    payload: UpdateMessagePayload,
  ): boolean {
    if (!payload.roomId) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_ROOM_ID);
      return false;
    }
    if (!payload.messageId) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_MESSAGE_ID);
      return false;
    }
    if (!payload.content) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_CONTENT);
      return false;
    }
    return true;
  }

  private _validateDeleteMessagePayload(
    client: Socket,
    payload: DeleteMessagePayload,
  ): boolean {
    if (!payload.roomId) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_ROOM_ID);
      return false;
    }
    if (!payload.messageId) {
      this.handleError(client, MESSAGE_ERRORS.MISSING_MESSAGE_ID);
      return false;
    }
    return true;
  }

  private _validateClientAccess(client: Socket, roomId: string) {
    const clientData = this.getClientDataOrFail(
      client,
      MESSAGE_ERRORS.UNAUTHENTICATED,
    );
    if (!clientData) return null;

    if (
      !this.validateClientInRoom(
        client,
        roomId,
        MESSAGE_ERRORS.JOIN_MESSAGES_FIRST,
      )
    ) {
      return null;
    }

    return clientData;
  }

  private _validateMessageOwnership(
    client: Socket,
    clientUserId: string,
    authorId: string,
    errorMessage: string,
  ): boolean {
    if (clientUserId !== authorId) {
      this.handleError(client, errorMessage);
      return false;
    }
    return true;
  }

  private _validateMessageParameters(
    messageId: string,
    content: string,
    roomId: string,
  ): boolean {
    if (!messageId) {
      return false;
    }
    if (!content) {
      return false;
    }
    if (!roomId) {
      return false;
    }
    return true;
  }
}
