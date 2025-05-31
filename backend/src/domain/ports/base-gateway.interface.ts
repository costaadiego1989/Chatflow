import { Socket } from 'socket.io';
import { Result } from '../../helpers/result-helper';

export interface IBaseGateway {
  initialize(): void;
  handleError(client: Socket, errorMessage: string): void;
  handleEventError(client: Socket, eventName: string, error: Error): void;
  handleOperationError(operation: string, error: Error): Result<any>;
}
