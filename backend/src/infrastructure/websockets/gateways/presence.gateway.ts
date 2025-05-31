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
  PRESENCE_ERRORS,
  PRESENCE_LOG_MESSAGES,
  BaseGateway,
} from '../imports/presence.gateway.imports';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PresenceGateway extends BaseGateway {
  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly chatOrchestrationService: ChatOrchestrationService,
  ) {
    super(chatOrchestrationService, PresenceGateway.name);
  }

  @SubscribeMessage(ChatEvents.GET_ONLINE_USERS)
  handleGetOnlineUsers(@ConnectedSocket() client: Socket): void {
    try {
      this.logger.log(PRESENCE_LOG_MESSAGES.GETTING_STATS);
      const stats = this.getConnectionStats();
      this.logger.log(PRESENCE_LOG_MESSAGES.SENDING_ONLINE_USERS);
      client.emit(ChatEvents.ONLINE_USERS, {
        totalConnections: stats.totalConnections,
        success: true,
      });
    } catch (error) {
      this.handleEventError(client, 'handleGetOnlineUsers', error);
    }
  }

  @SubscribeMessage(ChatEvents.CHECK_USER_ONLINE)
  handleCheckUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ): void {
    try {
      if (!payload.userId) {
        this.handleError(client, PRESENCE_ERRORS.USER_ID_REQUIRED);
        return;
      }
      this.logger.log(
        PRESENCE_LOG_MESSAGES.CHECKING_USER_ONLINE(payload.userId),
      );
      const isOnline = this.isUserConnected(payload.userId);
      this.logger.log(
        PRESENCE_LOG_MESSAGES.SENDING_USER_STATUS(payload.userId),
      );
      client.emit(ChatEvents.USER_ONLINE_STATUS, {
        userId: payload.userId,
        isOnline,
        success: true,
      });
    } catch (error) {
      this.handleEventError(client, 'handleCheckUserOnline', error);
    }
  }

  getConnectionStats(): {
    totalConnections: number;
    usersByRoom: Record<
      string,
      { count: number; users: Array<{ userId: string; username: string }> }
    >;
  } {
    const result = this.chatOrchestrationService.getConnectionStats();
    if (result.success) {
      return result.data;
    }
    this.logger.error(
      `${PRESENCE_ERRORS.FAILED_TO_GET_CONNECTION_STATS}: ${result.error}`,
    );
    return {
      totalConnections: 0,
      usersByRoom: {},
    };
  }

  isUserConnected(userId: string): boolean {
    const result = this.chatOrchestrationService.isUserConnected(userId);
    if (result.success) {
      return result.data;
    }
    this.logger.error(
      `${PRESENCE_ERRORS.FAILED_TO_CHECK_USER_ONLINE}: ${result.error}`,
    );
    return false;
  }

  protected _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(`Error in ${operation}: ${error.message}`);
    return ResultHelper.failure(PRESENCE_ERRORS.FAILED_TO_NOTIFY);
  }
}
