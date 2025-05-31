export const ROOM_LOG_MESSAGES = {
  USER_JOINING: (userId: string, roomId: string) =>
    `User ${userId} is joining room ${roomId}`,
  USER_LEAVING: (userId: string, roomId: string) =>
    `User ${userId} is leaving room ${roomId}`,
  SENDING_MESSAGE: (roomId: string) => `Sending message to room ${roomId}`,
  FETCHING_MESSAGES: (roomId: string) => `Fetching messages for room ${roomId}`,
  FAILED_CREATE_MESSAGE: (error: string) =>
    `Failed to create message: ${error}`,
  FAILED_FETCH_MESSAGES: (error: string) =>
    `Failed to fetch messages: ${error}`,
  ERROR_JOINING_ROOM: (error: string) => `Error joining room: ${error}`,
  ERROR_LEAVING_ROOM: (error: string) => `Error leaving room: ${error}`,
  ERROR_SENDING_MESSAGE: (error: string) => `Error sending message: ${error}`,
  ERROR_OPERATION: (operation: string, error: string) =>
    `Error in ${operation}: ${error}`,
  CLIENT_REQUIRED: 'Client is required',
  ROOM_ID_REQUIRED: 'Room ID is required',
  USER_ID_REQUIRED: 'User ID is required',
  USERNAME_REQUIRED: 'Username is required',
  INVALID_MESSAGE: 'Invalid message data',
  MESSAGE_NOT_FOUND: 'Message not found',
  UNAUTHORIZED_TO_UPDATE_MESSAGE: 'Unauthorized to update this message',
  UNAUTHORIZED_TO_DELETE_MESSAGE: 'Unauthorized to delete this message',
  MESSAGE_ID_REQUIRED: 'Message ID is required',
  CONTENT_REQUIRED: 'Content is required',
};
