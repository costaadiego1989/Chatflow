import { Result } from '../../../helpers/result-helper';

export interface TypingNotification {
  userId: string;
  username: string;
  roomId: string;
  timestamp: Date;
}

export interface TypingStatus {
  roomId: string;
  usersTyping: Array<{
    userId: string;
    username: string;
    startedAt: Date;
  }>;
}

export enum TypingEvents {
  STARTED_TYPING = 'startedTyping',
  STOPPED_TYPING = 'stoppedTyping',
  TYPING_STATUS_CHANGED = 'typingStatusChanged',
}

export interface ITypingNotificationService {
  userStartedTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void>;

  userStoppedTyping(
    userId: string,
    username: string,
    roomId: string,
  ): Result<void>;

  getTypingStatus(roomId: string): Result<TypingStatus>;
}
