import { Result } from '../../helpers/result-helper';

export interface ClientData {
  userId: string;
  username: string;
  rooms: Set<string>;
}

export interface IClientManager {
  registerClient(
    clientId: string,
    userId: string,
    username: string,
  ): Result<ClientData>;
  removeClient(clientId: string): Result<ClientData | null>;
  getClientData(clientId: string): Result<ClientData | null>;
  joinRoom(clientId: string, roomId: string): Result<boolean>;
  leaveRoom(clientId: string, roomId: string): Result<boolean>;
  isClientInRoom(clientId: string, roomId: string): Result<boolean>;
  updateUsername(clientId: string, username: string): Result<boolean>;
  getUsersInRoom(
    roomId: string,
  ): Result<Array<{ userId: string; username: string }>>;
  isUserConnected(userId: string): Result<boolean>;
  getRoomsForClient(clientId: string): Result<Set<string> | null>;
}
