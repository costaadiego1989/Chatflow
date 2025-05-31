import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Subject } from 'rxjs';
import {
  ITypingNotificationService,
  TypingNotification,
  TypingStatus,
} from '../../domain/protocols/websocket/typing-notification.protocol';
import { ResultHelper, Result } from '../../helpers/result-helper';

const TYPING_MESSAGES = {
  ERROR_STARTED_TYPING: 'Error while processing started typing event',
  ERROR_STOPPED_TYPING: 'Error while processing stopped typing event',
  ERROR_GET_STATUS: 'Error while getting typing status',
  ERROR_OPERATION: (operation: string, error: string) => 
    `Error in ${operation}: ${error}`,
};

interface TypingUser {
  username: string;
  timestamp: Date;
}

type RoomTypersMap = Map<string, TypingUser>;

@Injectable()
export class TypingNotificationService
  implements ITypingNotificationService, OnModuleDestroy
{
  private readonly typingSubject = new Subject<TypingNotification>();
  public readonly typingEvents$ = this.typingSubject.asObservable();
  private readonly activeTypers = new Map<string, RoomTypersMap>();
  private readonly TYPING_TIMEOUT_MS = 5000;
  private readonly cleanupInterval: NodeJS.Timeout;
  private readonly logger = new Logger(TypingNotificationService.name);

  constructor() {
    this.cleanupInterval = setInterval(
      () => this._cleanupInactiveTypers(),
      this.TYPING_TIMEOUT_MS,
    );
  }

  userStartedTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void> {
    try {
      this._ensureRoomExists(roomId);
      this._updateUserTypingStatus(userId, username, roomId);
      this._notifyTypingStatusChange(userId, username, roomId);
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('userStartedTyping', error);
    }
  }

  private _ensureRoomExists(roomId: string): void {
    if (!this.activeTypers.has(roomId)) {
      this.activeTypers.set(roomId, new Map<string, TypingUser>());
    }
  }

  private _updateUserTypingStatus(
    userId: string,
    username: string,
    roomId: string,
  ): void {
    const roomTypers = this.activeTypers.get(roomId);
    roomTypers.set(userId, {
      username,
      timestamp: new Date(),
    });
  }

  private _notifyTypingStatusChange(
    userId: string,
    username: string,
    roomId: string,
  ): void {
    this.typingSubject.next({
      userId,
      username,
      roomId,
      timestamp: new Date(),
    });
  }

  userStoppedTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void> {
    try {
      if (this._isUserTypingInRoom(userId, roomId)) {
        this._removeUserFromRoom(userId, roomId);
        this._notifyTypingStatusChange(userId, username, roomId);
      }
      return ResultHelper.success();
    } catch (error) {
      return this._handleError('userStoppedTyping', error);
    }
  }

  private _isUserTypingInRoom(userId: string, roomId: string): boolean {
    const roomTypers = this.activeTypers.get(roomId);
    return roomTypers && roomTypers.has(userId);
  }

  private _removeUserFromRoom(userId: string, roomId: string): void {
    const roomTypers = this.activeTypers.get(roomId);
    roomTypers.delete(userId);
    if (roomTypers.size === 0) {
      this.activeTypers.delete(roomId);
    }
  }

  getTypingStatus(roomId: string): Result<TypingStatus> {
    try {
      const status = {
        roomId,
        usersTyping: this._getUsersTypingInRoom(roomId),
      };
      return ResultHelper.success(status);
    } catch (error) {
      return this._handleError('getTypingStatus', error);
    }
  }

  private _getUsersTypingInRoom(roomId: string): Array<{
    userId: string;
    username: string;
    startedAt: Date;
  }> {
    const usersTyping = [];
    const roomTypers = this.activeTypers.get(roomId);
    if (roomTypers) {
      for (const [userId, data] of roomTypers.entries()) {
        usersTyping.push({
          userId,
          username: data.username,
          startedAt: data.timestamp,
        });
      }
    }
    return usersTyping;
  }

  private _cleanupInactiveTypers(): void {
    try {
      const now = new Date().getTime();
      for (const [roomId, roomTypers] of this.activeTypers.entries()) {
        this._cleanupInactiveTypersInRoom(roomId, roomTypers, now);
      }
    } catch (error) {
      this.logger.error(TYPING_MESSAGES.ERROR_OPERATION('cleanupInactiveTypers', error.message));
    }
  }

  private _cleanupInactiveTypersInRoom(
    roomId: string,
    roomTypers: RoomTypersMap,
    currentTime: number,
  ): void {
    for (const [userId, data] of roomTypers.entries()) {
      const lastUpdate = data.timestamp.getTime();
      const timeElapsed = currentTime - lastUpdate;
      if (timeElapsed > this.TYPING_TIMEOUT_MS) {
        const result = this.userStoppedTyping(userId, data.username, roomId);
        if (!result.success) {
          this.logger.warn(`Failed to clean up inactive typer: ${result.error}`);
        }
      }
    }
  }

  onModuleDestroy(): void {
    this._disposeCleanupInterval();
  }

  private _disposeCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private _handleError(operation: string, error: Error): Result<any> {
    const errorMessage = TYPING_MESSAGES.ERROR_OPERATION(operation, error.message);
    this.logger.error(errorMessage);
    return ResultHelper.failure(errorMessage);
  }
}
