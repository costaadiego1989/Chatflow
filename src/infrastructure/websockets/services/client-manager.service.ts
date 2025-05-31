import {
  Injectable,
  Logger,
  IClientManager,
  ClientData,
  ResultHelper,
  Result,
  CLIENT_MESSAGES,
  CLIENT_ERRORS,
} from '../imports/client-manager.service.imports';

@Injectable()
export class ClientManagerService implements IClientManager {
  private readonly logger = new Logger(ClientManagerService.name);
  private readonly connectedClients = new Map<string, ClientData>();

  registerClient(
    clientId: string,
    userIdOrData: string | ClientData,
    username?: string,
  ): Result<ClientData> {
    try {
      let clientData: ClientData;
      if (typeof userIdOrData === 'object') {
        clientData = {
          userId: userIdOrData.userId,
          username: userIdOrData.username,
          rooms: new Set<string>(),
        };
      } else {
        if (!username) {
          return ResultHelper.failure(CLIENT_ERRORS.USERNAME_REQUIRED);
        }
        clientData = {
          userId: userIdOrData,
          username: username,
          rooms: new Set<string>(),
        };
      }
      this.logger.debug(
        CLIENT_MESSAGES.CLIENT_REGISTERED(clientId, clientData.userId),
      );
      this.connectedClients.set(clientId, clientData);
      return ResultHelper.success(clientData);
    } catch (error) {
      return this._handleError('registerClient', error);
    }
  }

  removeClient(clientId: string): Result<ClientData | null> {
    try {
      const clientData = this.connectedClients.get(clientId);
      if (clientData) {
        this.logger.debug(
          CLIENT_MESSAGES.CLIENT_REMOVED(clientId, clientData.userId),
        );
        this.connectedClients.delete(clientId);
        return ResultHelper.success(clientData);
      }
      return ResultHelper.success(null);
    } catch (error) {
      return this._handleError('removeClient', error);
    }
  }

  getClientData(clientId: string): Result<ClientData | null> {
    try {
      const clientData = this.connectedClients.get(clientId) || null;
      return ResultHelper.success(clientData);
    } catch (error) {
      return this._handleError('getClientData', error);
    }
  }

  joinRoom(clientId: string, roomId: string): Result<boolean> {
    try {
      const clientData = this.connectedClients.get(clientId);
      if (!clientData) {
        this.logger.debug(CLIENT_MESSAGES.CLIENT_NOT_FOUND(clientId));
        return ResultHelper.success(false);
      }
      clientData.rooms.add(roomId);
      this.logger.debug(CLIENT_MESSAGES.CLIENT_JOINED_ROOM(clientId, roomId));
      return ResultHelper.success(true);
    } catch (error) {
      return this._handleError('joinRoom', error);
    }
  }

  leaveRoom(clientId: string, roomId: string): Result<boolean> {
    try {
      const clientData = this.connectedClients.get(clientId);
      if (!clientData) {
        this.logger.debug(CLIENT_MESSAGES.CLIENT_NOT_FOUND(clientId));
        return ResultHelper.success(false);
      }
      const removed = clientData.rooms.delete(roomId);
      if (removed) {
        this.logger.debug(CLIENT_MESSAGES.CLIENT_LEFT_ROOM(clientId, roomId));
      }
      return ResultHelper.success(removed);
    } catch (error) {
      return this._handleError('leaveRoom', error);
    }
  }

  isClientInRoom(clientId: string, roomId: string): Result<boolean> {
    try {
      const clientData = this.connectedClients.get(clientId);
      const isInRoom = clientData ? clientData.rooms.has(roomId) : false;
      return ResultHelper.success(isInRoom);
    } catch (error) {
      return this._handleError('isClientInRoom', error);
    }
  }

  updateUsername(clientId: string, username: string): Result<boolean> {
    try {
      const clientData = this.connectedClients.get(clientId);
      if (!clientData) {
        this.logger.debug(CLIENT_MESSAGES.CLIENT_NOT_FOUND(clientId));
        return ResultHelper.success(false);
      }
      clientData.username = username;
      this.logger.debug(CLIENT_MESSAGES.USERNAME_UPDATED(clientId, username));
      return ResultHelper.success(true);
    } catch (error) {
      return this._handleError('updateUsername', error);
    }
  }

  getUsersInRoom(
    roomId: string,
  ): Result<Array<{ userId: string; username: string }>> {
    try {
      const users: Array<{ userId: string; username: string }> = [];
      this.connectedClients.forEach((data) => {
        if (data.rooms.has(roomId)) {
          users.push({
            userId: data.userId,
            username: data.username,
          });
        }
      });
      return ResultHelper.success(users);
    } catch (error) {
      return this._handleError('getUsersInRoom', error);
    }
  }

  getAllRooms(): Result<Set<string>> {
    try {
      const allRooms = new Set<string>();
      this.connectedClients.forEach((clientData) => {
        clientData.rooms.forEach((roomId) => {
          allRooms.add(roomId);
        });
      });
      return ResultHelper.success(allRooms);
    } catch (error) {
      return this._handleError('getAllRooms', error);
    }
  }

  getClientsInRoom(
    roomId: string,
  ): Result<Array<{ clientId: string; userId: string; username: string }>> {
    try {
      const clients: Array<{
        clientId: string;
        userId: string;
        username: string;
      }> = [];
      this.connectedClients.forEach((data, clientId) => {
        if (data.rooms.has(roomId)) {
          clients.push({
            clientId,
            userId: data.userId,
            username: data.username,
          });
        }
      });
      return ResultHelper.success(clients);
    } catch (error) {
      return this._handleError('getClientsInRoom', error);
    }
  }

  isUserConnected(userId: string): Result<boolean> {
    try {
      for (const clientData of this.connectedClients.values()) {
        if (clientData.userId === userId) {
          return ResultHelper.success(true);
        }
      }
      return ResultHelper.success(false);
    } catch (error) {
      return this._handleError('isUserConnected', error);
    }
  }

  getRoomsForClient(clientId: string): Result<Set<string> | null> {
    try {
      const clientData = this.connectedClients.get(clientId);
      return ResultHelper.success(clientData ? clientData.rooms : null);
    } catch (error) {
      return this._handleError('getRoomsForClient', error);
    }
  }

  getAllClientsCount(): Result<number> {
    try {
      return ResultHelper.success(this.connectedClients.size);
    } catch (error) {
      return this._handleError('getAllClientsCount', error);
    }
  }

  getAllRoomsWithClients(): Result<Record<string, { count: number; users: Array<{ userId: string; username: string }> }>> {
    try {
      const roomsWithClients: Record<string, { count: number; users: Array<{ userId: string; username: string }> }> = {};
      const allRooms = new Set<string>();
      this.connectedClients.forEach((data) => {
        data.rooms.forEach((roomId) => {
          allRooms.add(roomId);
        });
      });
      for (const roomId of allRooms) {
        const usersResult = this.getUsersInRoom(roomId);
        if (!usersResult.success) {
          this.logger.error(
            CLIENT_ERRORS.ERROR_GETTING_USERS_IN_ROOM(
              roomId,
              usersResult.error,
            ),
          );
          continue;
        }
        const users = usersResult.data;
        roomsWithClients[roomId] = {
          count: users.length,
          users: users,
        };
      }
      return ResultHelper.success(roomsWithClients);
    } catch (error) {
      return this._handleError('getAllRoomsWithClients', error);
    }
  }

  private _handleError(operation: string, error: Error): Result<any> {
    this.logger.error(
      CLIENT_MESSAGES.ERROR_OPERATION(operation, error.message),
    );
    return ResultHelper.failure(error.message);
  }
}
