import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  Server,
  Socket,
  Injectable,
  ChatEvents,
  Result,
  ResultHelper,
  ChatOrchestrationService,
  ClientData,
  GetRoomMessagesPayload,
  ROOM_ERRORS,
  ROOM_LOG_MESSAGES,
  BaseGateway,
} from '../imports/room.gateway.imports';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway extends BaseGateway {
  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly chatOrchestrationService: ChatOrchestrationService,
  ) {
    super(chatOrchestrationService, RoomGateway.name);
  }

  @SubscribeMessage(ChatEvents.JOIN_ROOM)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; username?: string },
  ): void {
    try {
      if (!payload.roomId) {
        this.handleError(client, ROOM_ERRORS.MISSING_ROOM_ID);
        return;
      }
      if (payload.username) {
        this.chatOrchestrationService.updateUsername(
          client.id,
          payload.username,
        );
      }
      const result = this.joinRoom(client, payload.roomId);
      if (!result.success) {
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleJoinRoom', error);
    }
  }

  @SubscribeMessage(ChatEvents.LEAVE_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    try {
      if (!payload.roomId) {
        this.handleError(client, ROOM_ERRORS.MISSING_ROOM_ID);
        return;
      }
      const result = this.leaveRoom(client, payload.roomId);
      if (!result.success) {
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleLeaveRoom', error);
    }
  }

  @SubscribeMessage(ChatEvents.GET_ROOM_USERS)
  handleGetRoomUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    try {
      if (!payload.roomId) {
        this.handleError(client, ROOM_ERRORS.MISSING_ROOM_ID);
        return;
      }
      const users = this.getUsersInRoom(payload.roomId);
      client.emit(ChatEvents.ROOM_USERS, {
        roomId: payload.roomId,
        users,
        count: users.length,
        success: true,
      });
    } catch (error) {
      this.handleEventError(client, 'handleGetRoomUsers', error);
    }
  }

  @SubscribeMessage(ChatEvents.GET_ROOM_MESSAGES)
  async handleGetRoomMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: GetRoomMessagesPayload,
  ): Promise<void> {
    try {
      if (!payload.roomId) {
        this.handleError(client, ROOM_ERRORS.MISSING_ROOM_ID);
        return;
      }
      const clientData = this.getClientDataOrFail(
        client,
        ROOM_ERRORS.UNAUTHENTICATED,
      );
      if (!clientData) {
        return;
      }
      if (
        !this.validateClientInRoom(
          client,
          payload.roomId,
          ROOM_ERRORS.JOIN_ROOM_FIRST,
        )
      ) {
        return;
      }
      const messagesResult =
        await this.chatOrchestrationService.getRoomMessages(
          payload.roomId,
          payload.limit,
          payload.offset,
        );
      this.logger.log(ROOM_LOG_MESSAGES.GETTING_MESSAGES(payload.roomId));
      if (!messagesResult.success) {
        this.handleError(client, messagesResult.error);
        return;
      }
      client.emit(ChatEvents.ROOM_MESSAGES, {
        roomId: payload.roomId,
        messages: messagesResult.data,
        success: true,
      });
    } catch (error) {
      this.handleEventError(client, 'handleGetRoomMessages', error);
    }
  }

  joinRoom(client: Socket, roomId: string): Result<void> {
    try {
      if (!roomId) {
        return ResultHelper.failure(ROOM_ERRORS.ROOM_REQUIRED);
      }
      const clientDataResult = this.chatOrchestrationService.getClientData(
        client.id,
      );
      if (!clientDataResult.success || !clientDataResult.data) {
        return ResultHelper.failure(ROOM_ERRORS.UNAUTHENTICATED);
      }
      const clientData = clientDataResult.data as ClientData;
      this.logger.log(
        ROOM_LOG_MESSAGES.USER_JOINING(clientData.userId, roomId),
      );
      return this.chatOrchestrationService.processClientJoinRoom(
        client,
        roomId,
        clientData.userId,
        clientData.username,
      );
    } catch (error) {
      return this.handleOperationError('joinRoom', error);
    }
  }

  leaveRoom(client: Socket, roomId: string): Result<void> {
    try {
      if (!roomId) {
        return ResultHelper.failure(ROOM_ERRORS.ROOM_REQUIRED);
      }
      const clientDataResult = this.chatOrchestrationService.getClientData(
        client.id,
      );
      if (!clientDataResult.success || !clientDataResult.data) {
        return ResultHelper.failure(ROOM_ERRORS.UNAUTHENTICATED);
      }
      const clientData = clientDataResult.data as ClientData;
      this.logger.log(
        ROOM_LOG_MESSAGES.USER_LEAVING(clientData.userId, roomId),
      );
      return this.chatOrchestrationService.processClientLeaveRoom(
        client,
        roomId,
        clientData.userId,
        clientData.username,
      );
    } catch (error) {
      return this.handleOperationError('leaveRoom', error);
    }
  }

  getUsersInRoom(roomId: string): Array<{ userId: string; username: string }> {
    this.logger.log(ROOM_LOG_MESSAGES.GETTING_USERS(roomId));
    const result = this.chatOrchestrationService.getUsersInRoom(roomId);
    if (result.success) {
      return result.data;
    }
    this.logger.error(`${ROOM_ERRORS.FAILED_TO_GET_USERS}: ${result.error}`);
    return [];
  }

  notifyUserJoinedRoom(roomId: string, userId: string): Result<void> {
    return this.emitEventToRoom(
      roomId,
      ChatEvents.USER_JOINED_ROOM,
      { roomId, userId },
      'notifyUserJoinedRoom',
    );
  }

  notifyUserLeftRoom(roomId: string, userId: string): Result<void> {
    return this.emitEventToRoom(
      roomId,
      ChatEvents.USER_LEFT_ROOM,
      { roomId, userId },
      'notifyUserLeftRoom',
    );
  }

  protected _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(`Error in ${operation}: ${error.message}`);
    return ResultHelper.failure(ROOM_ERRORS.FAILED_TO_NOTIFY);
  }
}
