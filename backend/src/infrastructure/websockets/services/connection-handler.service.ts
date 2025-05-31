import {
  Injectable,
  Logger,
  Socket,
  ChatOrchestrationService,
  ISocketWithAuth,
  AuthUser,
  ClientData,
  ChatEvents,
  Result,
  ResultHelper,
  CONNECTION_ERROR_MESSAGES,
} from '../imports/connection-handler.service.imports';

@Injectable()
export class ConnectionHandlerService {
  private readonly logger = new Logger(ConnectionHandlerService.name);

  constructor(
    private readonly chatOrchestrationService: ChatOrchestrationService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const socketWithAuth = client as ISocketWithAuth;
      if (!socketWithAuth.data?.user) {
        this._handleError(CONNECTION_ERROR_MESSAGES.CONNECTION_REJECTED);
        client.disconnect();
        return;
      }
      const authUser = socketWithAuth.data.user;
      const result = this._registerClient(client, authUser);
      if (!result) {
        this._handleError(CONNECTION_ERROR_MESSAGES.CLIENT_REGISTRATION_FAILED);
        client.disconnect();
        return;
      }
      this.logger.log(
        `${CONNECTION_ERROR_MESSAGES.CLIENT_CONNECTED}: ${client.id} (${authUser.username})`,
      );
      client.emit(ChatEvents.CONNECTION_ESTABLISHED, {
        clientId: client.id,
        userId: authUser.userId,
        username: authUser.username,
      });
    } catch (error) {
      this._handleError(
        CONNECTION_ERROR_MESSAGES.ERROR_HANDLING_CONNECTION,
        error,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    try {
      const clientDataResult = this._getClientData(client);
      if (!clientDataResult) {
        this.logger.log(
          `${CONNECTION_ERROR_MESSAGES.UNKNOWN_CLIENT_DISCONNECTED}: ${client.id}`,
        );
        return;
      }
      const clientData = clientDataResult;
      this.logger.log(
        `${CONNECTION_ERROR_MESSAGES.CLIENT_DISCONNECTED}: ${client.id}, userId: ${clientData.userId}`,
      );
      this._handleClientRoomsOnDisconnect(client, clientData);
      this.chatOrchestrationService.removeClient(client.id);
    } catch (error) {
      this._handleError(
        CONNECTION_ERROR_MESSAGES.ERROR_HANDLING_DISCONNECT,
        error,
      );
    }
  }

  private _registerClient(client: Socket, authUser: AuthUser): boolean {
    const result = this.chatOrchestrationService.registerClient(
      client.id,
      authUser.userId,
      authUser.username,
    );
    return result.success;
  }

  private _getClientData(client: Socket): ClientData {
    const result = this.chatOrchestrationService.getClientData(client.id);
    if (!result.success || !result.data) {
      return null;
    }
    return result.data as ClientData;
  }

  private _handleClientRoomsOnDisconnect(
    client: Socket,
    clientData: ClientData,
  ): void {
    try {
      const clientRoomsResult = this.chatOrchestrationService.getClientRooms(
        client.id,
      );
      if (!clientRoomsResult.success || !clientRoomsResult.data) {
        return;
      }
      const rooms = clientRoomsResult.data;
      rooms.forEach((roomId) => {
        this.chatOrchestrationService.processClientLeaveRoom(
          client,
          roomId,
          clientData.userId,
          clientData.username,
        );
      });
    } catch (error) {
      this._handleError(
        CONNECTION_ERROR_MESSAGES.ERROR_HANDLING_CLIENT_ROOMS_ON_DISCONNECT,
        error,
      );
    }
  }
  private _handleError(message: string, error?: Error): Result<any> {
    this.logger.error(`Error: ${error.message}`);
    return ResultHelper.failure(`${message}: ${error.message}`);
  }
}
