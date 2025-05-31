export enum ChatEvents {
  JOIN_ROOM = 'joinRoom',
  LEAVE_ROOM = 'leaveRoom',
  SEND_MESSAGE = 'sendMessage',
  USER_CONNECTED = 'userConnected',
  USER_DISCONNECTED = 'userDisconnected',
  USER_JOINED_ROOM = 'userJoinedRoom',
  USER_LEFT_ROOM = 'userLeftRoom',
  MESSAGE_RECEIVED = 'messageReceived',
  MESSAGE_UPDATED = 'messageUpdated',
  MESSAGE_DELETED = 'messageDeleted',
  TYPING = 'typing',
  STOPPED_TYPING = 'stoppedTyping',
  TYPING_STATUS_CHANGED = 'typingStatusChanged',
  ERROR = 'error',
  CONNECTION_ESTABLISHED = 'connectionEstablished',
  GET_ONLINE_USERS = 'getOnlineUsers',
  ONLINE_USERS = 'onlineUsers',
  GET_ROOM_USERS = 'getRoomUsers',
  ROOM_USERS = 'roomUsers',
  CHECK_USER_ONLINE = 'checkUserOnline',
  USER_ONLINE_STATUS = 'userOnlineStatus',
  GET_ROOM_MESSAGES = 'getRoomMessages',
  ROOM_MESSAGES = 'roomMessages',
  UPDATE_MESSAGE = 'updateMessage',
  DELETE_MESSAGE = 'deleteMessage',
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface SendMessagePayload {
  roomId: string;
  content: string;
  authorId: string;
}

export interface TypingPayload {
  roomId: string;
  userId: string;
  username: string;
}

export interface MessageReceivedPayload {
  id: string;
  roomId: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

export interface UserRoomPayload {
  roomId: string;
  userId: string;
  username: string;
}

export interface GetRoomMessagesPayload {
  roomId: string;
  limit?: number;
  offset?: number;
}

export interface UpdateMessagePayload {
  messageId: string;
  content: string;
  roomId: string;
  authorId: string;
}

export interface DeleteMessagePayload {
  messageId: string;
  roomId: string;
  authorId: string;
}

export interface MessageUpdatedPayload {
  id: string;
  roomId: string;
  content: string;
  authorId: string;
  updatedAt: Date;
  isEdited: boolean;
}

export interface MessageDeletedPayload {
  id: string;
  roomId: string;
  authorId: string;
  deletedAt: Date;
}
