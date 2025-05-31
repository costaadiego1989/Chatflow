export const TYPING_ERRORS = {
  ROOM_REQUIRED: 'Room ID is required',
  UNAUTHENTICATED: 'Client not authenticated',
  JOIN_TYPING_FIRST: 'You must join the room before sending typing events',
  FAILED_TO_NOTIFY_TYPING: 'Failed to notify about typing status',
  MISSING_ROOM_ID: 'Room ID is required',
};

export const TYPING_LOG_MESSAGES = {
  USER_TYPING: (userId: string, roomId: string) =>
    `User ${userId} is typing in room ${roomId}`,
  USER_STOPPED_TYPING: (userId: string, roomId: string) =>
    `User ${userId} stopped typing in room ${roomId}`,
  FAILED_NOTIFY_TYPING_STARTED: (error: string) =>
    `Failed to notify typing started: ${error}`,
  FAILED_NOTIFY_TYPING_STOPPED: (error: string) =>
    `Failed to notify typing stopped: ${error}`,
};
