export const ROOM_ERRORS = {
  ROOM_REQUIRED: 'Room ID is required',
  UNAUTHENTICATED: 'Client not authenticated',
  JOIN_ROOM_FIRST: 'You must join the room before performing this action',
  FAILED_TO_JOIN_ROOM: 'Failed to join room',
  FAILED_TO_LEAVE_ROOM: 'Failed to leave room',
  FAILED_TO_GET_USERS: 'Failed to get users in room',
  FAILED_TO_GET_MESSAGES: 'Failed to get messages',
  FAILED_TO_NOTIFY: 'Failed to send notification',
  MISSING_ROOM_ID: 'Room ID is required',
};

export const ROOM_LOG_MESSAGES = {
  USER_JOINING: (userId: string, roomId: string) =>
    `User ${userId} is joining room ${roomId}`,
  USER_LEAVING: (userId: string, roomId: string) =>
    `User ${userId} is leaving room ${roomId}`,
  GETTING_USERS: (roomId: string) => `Getting users in room ${roomId}`,
  GETTING_MESSAGES: (roomId: string) => `Getting messages for room ${roomId}`,
};
