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
  ChatOrchestrationService,
  Result,
  ResultHelper,
  TYPING_ERRORS,
  TYPING_LOG_MESSAGES,
  BaseGateway,
} from '../imports/typing.gateway.imports';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TypingGateway extends BaseGateway {
  @WebSocketServer()
  protected server: Server;

  constructor(
    protected readonly chatOrchestrationService: ChatOrchestrationService,
  ) {
    super(chatOrchestrationService, TypingGateway.name);
  }

  @SubscribeMessage(ChatEvents.TYPING)
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    try {
      if (!payload.roomId) {
        this.handleError(client, TYPING_ERRORS.MISSING_ROOM_ID);
        return;
      }
      const clientData = this.getClientDataOrFail(
        client,
        TYPING_ERRORS.UNAUTHENTICATED,
      );
      if (!clientData) return;
      if (
        !this.validateClientInRoom(
          client,
          payload.roomId,
          TYPING_ERRORS.JOIN_TYPING_FIRST,
        )
      ) {
        return;
      }
      this.logger.log(
        TYPING_LOG_MESSAGES.USER_TYPING(clientData.userId, payload.roomId),
      );
      const result = this.chatOrchestrationService.processClientStartTyping(
        clientData.userId,
        clientData.username,
        payload.roomId,
      );
      if (!result.success) {
        this.logger.warn(
          TYPING_LOG_MESSAGES.FAILED_NOTIFY_TYPING_STARTED(result.error),
        );
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleTyping', error);
    }
  }

  @SubscribeMessage(ChatEvents.STOPPED_TYPING)
  handleStoppedTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    try {
      if (!payload.roomId) {
        this.handleError(client, TYPING_ERRORS.MISSING_ROOM_ID);
        return;
      }
      const clientData = this.getClientDataOrFail(
        client,
        TYPING_ERRORS.UNAUTHENTICATED,
      );
      if (!clientData) return;
      if (
        !this.validateClientInRoom(
          client,
          payload.roomId,
          TYPING_ERRORS.JOIN_TYPING_FIRST,
        )
      ) {
        return;
      }
      this.logger.log(
        TYPING_LOG_MESSAGES.USER_STOPPED_TYPING(
          clientData.userId,
          payload.roomId,
        ),
      );
      const result = this.chatOrchestrationService.processClientStopTyping(
        clientData.userId,
        clientData.username,
        payload.roomId,
      );
      if (!result.success) {
        this.logger.warn(
          TYPING_LOG_MESSAGES.FAILED_NOTIFY_TYPING_STOPPED(result.error),
        );
        this.handleError(client, result.error);
      }
    } catch (error) {
      this.handleEventError(client, 'handleStoppedTyping', error);
    }
  }

  protected _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(`Error in ${operation}: ${error.message}`);
    return ResultHelper.failure(TYPING_ERRORS.FAILED_TO_NOTIFY_TYPING);
  }
}
