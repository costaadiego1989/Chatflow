import { Injectable, Logger } from '@nestjs/common';
import { TypingNotificationService } from './typing-notification.service';
import { ClientManagerService } from '../../infrastructure/websockets/services/client-manager.service';
import { RoomOperationsService } from '../../infrastructure/websockets/services/room-operations.service';
import { ChatEventService } from './chat-event.service';
import { Result, ResultHelper } from '../../helpers/result-helper';
import { Socket } from 'socket.io';
import { MessageCreatedEventPayload } from '../protocols/chat-event.protocol';
import { ClientData } from '../../domain/ports/client-manager.interface';
import { MessageData } from '../../domain/ports/message-repository.interface';

const ERROR_MESSAGES = {
  CLIENT_REGISTRATION: 'Failed to register client',
  CLIENT_REMOVAL: 'Failed to remove client',
  ROOM_JOIN: 'Failed to join room',
  ROOM_LEAVE: 'Failed to leave room',
  MESSAGE_SEND: 'Failed to send message',
  STATS_RETRIEVAL: 'Failed to retrieve connection statistics',
  ROOM_NOT_FOUND: 'Room not found',
  USER_NOT_FOUND: 'User not found',
  OPERATION_ERROR: (operation: string, error: string) =>
    `Error in operation ${operation}: ${error}`,
};

const ORCHESTRATION_MESSAGES = {
  ERROR_OPERATION: (operation: string, error: string) =>
    `Error in orchestration ${operation}: ${error}`,
  CLIENT_NOT_AUTHENTICATED: 'Cliente não autenticado',
  ROOM_ID_REQUIRED: 'ID da sala é obrigatório',
  USER_ID_REQUIRED: 'ID do usuário é obrigatório',
  USERNAME_REQUIRED: 'Nome de usuário é obrigatório',
  INVALID_MESSAGE: 'Dados da mensagem inválidos',
  FAILED_TO_NOTIFY_ABOUT_USER_JOIN: 'Failed to notify room about user join',
  FAILED_TO_NOTIFY_ABOUT_USER_LEAVE: 'Failed to notify room about user leave',
  FAILED_TO_NOTIFY_ABOUT_MESSAGE_CREATED: 'Failed to notify room about message created',
  FAILED_TO_NOTIFY_ABOUT_MESSAGE_UPDATED: 'Failed to notify room about message updated',
  FAILED_TO_NOTIFY_ABOUT_MESSAGE_DELETED: 'Failed to notify room about message deleted',
  FAILED_TO_UPDATE_MESSAGE: 'Failed to update message',
  FAILED_TO_DELETE_MESSAGE: 'Failed to delete message',
  MESSAGE_ID_REQUIRED: 'Message ID is required',
  CONTENT_REQUIRED: 'Content is required',
};

@Injectable()
export class ChatOrchestrationService {
  private readonly logger = new Logger(ChatOrchestrationService.name);

  constructor(
    private readonly typingNotificationService: TypingNotificationService,
    private readonly clientManagerService: ClientManagerService,
    private readonly roomOperationsService: RoomOperationsService,
    private readonly chatEventService: ChatEventService,
  ) {}

  registerClient(
    clientId: string,
    userIdOrData: string | ClientData,
    username?: string,
  ): Result<void> {
    try {
      const result = this.clientManagerService.registerClient(
        clientId,
        userIdOrData,
        username,
      );
      if (!result.success) {
        return ResultHelper.failure(
          `${ERROR_MESSAGES.CLIENT_REGISTRATION}: ${result.error}`,
        );
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('registerClient', error);
    }
  }

  removeClient(clientId: string): Result<void> {
    try {
      const result = this.clientManagerService.removeClient(clientId);

      if (!result.success) {
        return ResultHelper.failure(
          `${ERROR_MESSAGES.CLIENT_REMOVAL}: ${result.error}`,
        );
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('removeClient', error);
    }
  }

  getClientData(clientId: string): Result<any> {
    try {
      return this.clientManagerService.getClientData(clientId);
    } catch (error) {
      return this._handleError('getClientData', error);
    }
  }

  isClientInRoom(clientId: string, roomId: string): Result<boolean> {
    try {
      return this.clientManagerService.isClientInRoom(clientId, roomId);
    } catch (error) {
      return this._handleError('isClientInRoom', error);
    }
  }

  getClientRooms(clientId: string): Result<Set<string> | null> {
    try {
      return this.clientManagerService.getRoomsForClient(clientId);
    } catch (error) {
      return this._handleError('getClientRooms', error);
    }
  }

  updateUsername(clientId: string, username: string): Result<boolean> {
    try {
      return this.clientManagerService.updateUsername(clientId, username);
    } catch (error) {
      return this._handleError('updateUsername', error);
    }
  }

  processClientJoinRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    try {
      const joinResult = this._joinClientToRoom(
        client,
        roomId,
        userId,
        username,
      );
      if (!joinResult.success) {
        return joinResult;
      }
      const eventResult = this._notifyUserJoinedRoom(roomId, userId, username);
      if (!eventResult.success) {
        this.logger.warn(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_NOTIFY_ABOUT_USER_JOIN}: ${eventResult.error}`,
        );
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('processClientJoinRoom', error);
    }
  }

  processClientLeaveRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    try {
      const leaveResult = this._removeClientFromRoom(
        client,
        roomId,
        userId,
        username,
      );
      if (!leaveResult.success) {
        return leaveResult;
      }
      const eventResult = this._notifyUserLeftRoom(roomId, userId, username);
      if (!eventResult.success) {
        this.logger.warn(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_NOTIFY_ABOUT_USER_LEAVE}: ${eventResult.error}`,
        );
      }
      this._stopUserTyping(userId, username, roomId);
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('processClientLeaveRoom', error);
    }
  }

  async processClientSendMessage(
    roomId: string,
    message: any,
  ): Promise<Result<void>> {
    try {
      const sendResult = await this._sendMessageToRoom(roomId, message);
      if (!sendResult.success) {
        return sendResult;
      }
      const eventResult = this._notifyMessageCreated(roomId, message);
      if (!eventResult.success) {
        this.logger.warn(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_NOTIFY_ABOUT_MESSAGE_CREATED}: ${eventResult.error}`,
        );
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('processClientSendMessage', error);
    }
  }

  processClientStartTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void> {
    try {
      return this.typingNotificationService.userStartedTyping(
        userId,
        username,
        roomId,
      );
    } catch (error) {
      return this._handleError('processClientStartTyping', error);
    }
  }

  processClientStopTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void> {
    try {
      return this.typingNotificationService.userStoppedTyping(
        userId,
        username,
        roomId,
      );
    } catch (error) {
      return this._handleError('processClientStopTyping', error);
    }
  }

  getConnectionStats(): Result<{
    totalConnections: number;
    usersByRoom: Record<
      string,
      { count: number; users: Array<{ userId: string; username: string }> }
    >;
  }> {
    try {
      const totalUsers = this._getAllClientsCount();
      if (!totalUsers.success) {
        return ResultHelper.failure(
          `${ERROR_MESSAGES.STATS_RETRIEVAL}: ${totalUsers.error}`,
        );
      }

      const rooms = this._getAllRoomsWithClients();
      if (!rooms.success) {
        return ResultHelper.failure(
          `${ERROR_MESSAGES.STATS_RETRIEVAL}: ${rooms.error}`,
        );
      }

      const stats = {
        totalConnections: totalUsers.data,
        usersByRoom: rooms.data,
      };

      return ResultHelper.success(stats);
    } catch (error) {
      return this._handleError('getConnectionStats', error);
    }
  }

  isUserConnected(userId: string): Result<boolean> {
    try {
      return this.clientManagerService.isUserConnected(userId);
    } catch (error) {
      return this._handleError('isUserConnected', error);
    }
  }

  getUsersInRoom(
    roomId: string,
  ): Result<Array<{ userId: string; username: string }>> {
    try {
      return this.clientManagerService.getUsersInRoom(roomId);
    } catch (error) {
      return this._handleError('getUsersInRoom', error);
    }
  }

  getTypingStatus(roomId: string): Result<any> {
    try {
      if (!roomId) {
        return ResultHelper.failure(ORCHESTRATION_MESSAGES.ROOM_ID_REQUIRED);
      }
      return this.typingNotificationService.getTypingStatus(roomId);
    } catch (error) {
      return this._handleError('getTypingStatus', error);
    }
  }

  async getRoomMessages(
    roomId: string,
    limit?: number,
    offset?: number,
  ): Promise<Result<MessageData[]>> {
    try {
      if (!roomId) {
        return ResultHelper.failure(ORCHESTRATION_MESSAGES.ROOM_ID_REQUIRED);
      }
      return await this.roomOperationsService.getRoomMessages(
        roomId,
        limit,
        offset,
      );
    } catch (error) {
      return this._handleError('getRoomMessages', error);
    }
  }

  async processMessageUpdate(
    messageId: string,
    content: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<void>> {
    try {
      const validationResult = this._validateProcessMessageUpdate(
        messageId,
        content,
        roomId,
        authorId,
      );
      if (!validationResult.success) {
        return validationResult;
      }
      const updateResult = await this.roomOperationsService.updateMessage(
        messageId,
        content,
        roomId,
        authorId,
      );
      if (!updateResult.success) {
        this.logger.error(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_UPDATE_MESSAGE}: ${updateResult.error}`,
        );
        return ResultHelper.failure(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_UPDATE_MESSAGE}: ${updateResult.error}`,
        );
      }
      const updatedMessage = updateResult.data;
      const eventResult = this._notifyMessageUpdated(roomId, updatedMessage);
      if (!eventResult.success) {
        this.logger.warn(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_NOTIFY_ABOUT_MESSAGE_UPDATED}: ${eventResult.error}`,
        );
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('processMessageUpdate', error);
    }
  }

  async processMessageDelete(
    messageId: string,
    roomId: string,
    authorId: string,
  ): Promise<Result<void>> {
    try {
      const validationResult = this._validateProcessMessageDelete(
        messageId,
        roomId,
        authorId,
      );
      if (!validationResult.success) {
        return validationResult;
      }
      const deleteResult = await this.roomOperationsService.deleteMessage(
        messageId,
        roomId,
        authorId,
      );
      if (!deleteResult.success) {
        this.logger.error(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_DELETE_MESSAGE}: ${deleteResult.error}`,
        );
        return ResultHelper.failure(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_DELETE_MESSAGE}: ${deleteResult.error}`,
        );
      }
      const deletedMessage = deleteResult.data;
      const eventResult = this._notifyMessageDeleted(roomId, deletedMessage);
      if (!eventResult.success) {
        this.logger.warn(
          `${ORCHESTRATION_MESSAGES.FAILED_TO_NOTIFY_ABOUT_MESSAGE_DELETED}: ${eventResult.error}`,
        );
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('processMessageDelete', error);
    }
  }

  private _joinClientToRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    const result = this.roomOperationsService.joinRoom(
      client,
      roomId,
      userId,
      username,
    );

    if (!result.success) {
      return ResultHelper.failure(
        `${ERROR_MESSAGES.ROOM_JOIN}: ${result.error}`,
      );
    }

    return ResultHelper.success();
  }

  private _getAllClientsCount(): Result<number> {
    return this.clientManagerService.getAllClientsCount();
  }

  private _getAllRoomsWithClients(): Result<Record<string, { count: number; users: Array<{ userId: string; username: string }> }>> {
    return this.clientManagerService.getAllRoomsWithClients();
  }

  private _validateProcessMessageUpdate(
    messageId: string,
    content: string,
    roomId: string,
    authorId: string,
  ): Result<void> {
    if (!messageId) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.MESSAGE_ID_REQUIRED);
    }
    if (!content) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.CONTENT_REQUIRED);
    }
    if (!roomId) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.ROOM_ID_REQUIRED);
    }
    if (!authorId) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.USER_ID_REQUIRED);
    }
    return ResultHelper.success();
  }

  private _validateProcessMessageDelete(
    messageId: string,
    roomId: string,
    authorId: string,
  ): Result<void> {
    if (!messageId) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.MESSAGE_ID_REQUIRED);
    }
    if (!roomId) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.ROOM_ID_REQUIRED);
    }
    if (!authorId) {
      return ResultHelper.failure(ORCHESTRATION_MESSAGES.USER_ID_REQUIRED);
    }
    return ResultHelper.success();
  }

  private _removeClientFromRoom(
    client: Socket,
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    const result = this.roomOperationsService.leaveRoom(
      client,
      roomId,
      userId,
      username,
    );

    if (!result.success) {
      return ResultHelper.failure(
        `${ERROR_MESSAGES.ROOM_LEAVE}: ${result.error}`,
      );
    }

    return ResultHelper.success();
  }

  private _notifyUserJoinedRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    return this.chatEventService.emitUserJoinedRoom(roomId, userId, username);
  }

  private _notifyUserLeftRoom(
    roomId: string,
    userId: string,
    username: string,
  ): Result<void> {
    return this.chatEventService.emitUserLeftRoom(roomId, userId, username);
  }

  private _stopUserTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void> {
    return this.typingNotificationService.userStoppedTyping(
      userId,
      username,
      roomId,
    );
  }

  private async _sendMessageToRoom(
    roomId: string,
    message: any,
  ): Promise<Result<void>> {
    const result = await this.roomOperationsService.sendMessage(
      roomId,
      message,
    );

    if (!result.success) {
      return ResultHelper.failure(
        `${ERROR_MESSAGES.MESSAGE_SEND}: ${result.error}`,
      );
    }

    return ResultHelper.success();
  }

  private _notifyMessageCreated(roomId: string, message: any): Result<void> {
    try {
      const messageEvent: MessageCreatedEventPayload = {
        id: message.id || 'temp-id',
        content: message.content,
        authorId: message.authorId,
        roomId: roomId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
      };

      return this.chatEventService.emitMessageCreated(messageEvent);
    } catch (error) {
      return this._handleError('_notifyMessageCreated', error);
    }
  }

  private _notifyMessageUpdated(roomId: string, message: any): Result<void> {
    try {
      const messageEvent = {
        id: message.id,
        content: message.content,
        authorId: message.userId || message.authorId,
        roomId: roomId,
        updatedAt: message.updatedAt || new Date(),
        isEdited: true,
        createdAt: message.createdAt || new Date(),
      };
      return this.chatEventService.emitMessageUpdated(messageEvent);
    } catch (error) {
      return this._handleError('_notifyMessageUpdated', error);
    }
  }

  private _notifyMessageDeleted(roomId: string, message: any): Result<void> {
    try {
      const messageEvent = {
        id: message.id,
        roomId: roomId,
        authorId: message.userId || message.authorId,
        deletedAt: message.deletedAt || new Date(),
      };

      return this.chatEventService.emitMessageDeleted(messageEvent);
    } catch (error) {
      return this._handleError('_notifyMessageDeleted', error);
    }
  }

  private _handleError(operation: string, error: Error): Result<any> {
    const errorMessage = ERROR_MESSAGES.OPERATION_ERROR(
      operation,
      error.message,
    );
    this.logger.error(errorMessage);
    return ResultHelper.failure(errorMessage);
  }
}
