export interface INotificationService {
  setServer(server: any): void;
  notifyUserJoinedRoom(roomId: string, userId: string): void;
  notifyUserLeftRoom(roomId: string, userId: string): void;
  notifyMessageCreated(roomId: string, message: any): void;
  notifyMessageUpdated(roomId: string, message: any): void;
  notifyMessageDeleted(roomId: string, messageId: string): void;
}
