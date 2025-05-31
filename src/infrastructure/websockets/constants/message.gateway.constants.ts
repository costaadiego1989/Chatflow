export const MESSAGE_ERRORS = {
  ROOM_REQUIRED: 'Room ID is required',
  INVALID_MESSAGE: 'Invalid message data',
  UNAUTHENTICATED: 'Client not authenticated',
  JOIN_MESSAGES_FIRST: 'You must join the room before sending messages',
  MESSAGE_REQUIRED: 'Message data is required',
  MESSAGE_ID_REQUIRED: 'Message ID is required',
  EDIT_OWN_MESSAGES_ONLY: 'You can only edit your own messages',
  DELETE_OWN_MESSAGES_ONLY: 'You can only delete your own messages',
  FAILED_NOTIFICATION: 'Failed to send notification to room',
  MISSING_CONTENT: 'Message content is required',
  MISSING_MESSAGE_ID: 'Message ID is required',
  MISSING_ROOM_ID: 'Room ID is required',
};

export const MESSAGE_LOG_MESSAGES = {
  SENDING_MESSAGE: (roomId: string) => `Sending message to room ${roomId}`,
  UPDATING_MESSAGE: (messageId: string, roomId: string) =>
    `Updating message ${messageId} in room ${roomId}`,
  DELETING_MESSAGE: (messageId: string, roomId: string) =>
    `Deleting message ${messageId} from room ${roomId}`,
};
