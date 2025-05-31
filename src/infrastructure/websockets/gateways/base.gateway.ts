import {
  Injectable,
  Logger,
  Server,
  Socket,
  ChatEvents,
  IBaseGateway,
  Result,
  ResultHelper,
  ClientData,
  ChatOrchestrationService,
  BASE_GATEWAY_ERRORS,
} from '../imports/base.gateway.imports';

@Injectable()
export abstract class BaseGateway implements IBaseGateway {
  protected server: Server;
  protected readonly logger: Logger;

  constructor(
    protected readonly chatOrchestrationService: ChatOrchestrationService,
    loggerName: string,
  ) {
    this.logger = new Logger(loggerName);
  }

  initialize(): void {
    this.logger.log(`${this.constructor.name} initialized`);
  }

  handleError(client: Socket, errorMessage: string): void {
    client.emit(ChatEvents.ERROR, { message: errorMessage });
  }

  handleEventError(client: Socket, eventName: string, error: Error): void {
    this.logger.error(`Error in ${eventName}: ${error.message}`);
    this.handleError(client, error.message);
  }

  handleOperationError(operation: string, error: Error): Result<any> {
    return this._handleError(operation, error);
  }

  protected getClientDataOrFail(
    client: Socket,
    unauthenticatedMessage: string,
  ): ClientData | null {
    try {
      const clientDataResult = this.chatOrchestrationService.getClientData(
        client.id,
      );
      if (!clientDataResult.success || !clientDataResult.data) {
        this.handleError(client, unauthenticatedMessage);
        return null;
      }
      return clientDataResult.data as ClientData;
    } catch (error) {
      this.handleEventError(client, 'getClientDataOrFail', error);
      return null;
    }
  }

  protected validateClientInRoom(
    client: Socket,
    roomId: string,
    errorMessage: string,
  ): boolean {
    const isInRoomResult = this.chatOrchestrationService.isClientInRoom(
      client.id,
      roomId,
    );
    if (!isInRoomResult.success || !isInRoomResult.data) {
      this.handleError(client, errorMessage);
      return false;
    }
    return true;
  }

  protected emitEventToRoom(
    roomId: string,
    event: string,
    data: any,
    operation: string,
    roomRequiredMessage: string = BASE_GATEWAY_ERRORS.ROOM_REQUIRED,
    dataRequiredMessage: string = BASE_GATEWAY_ERRORS.DATA_REQUIRED,
  ): Result<void> {
    try {
      if (!roomId) {
        return ResultHelper.failure(roomRequiredMessage);
      }
      if (!data) {
        return ResultHelper.failure(dataRequiredMessage);
      }
      this.server.to(roomId).emit(event, data);
      return ResultHelper.success();
    } catch (error) {
      return this._handleError(operation, error);
    }
  }

  protected _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(`Error in ${operation}: ${error.message}`);
    return ResultHelper.failure(error.message);
  }
}
