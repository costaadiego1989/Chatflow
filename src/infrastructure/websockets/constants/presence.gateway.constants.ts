export const PRESENCE_ERRORS = {
  USER_ID_REQUIRED: 'User ID is required',
  UNAUTHENTICATED: 'Client not authenticated',
  FAILED_TO_GET_CONNECTION_STATS: 'Failed to get connection stats',
  FAILED_TO_CHECK_USER_ONLINE: 'Failed to check user online',
  FAILED_TO_NOTIFY: 'Failed to send notification',
};

export const PRESENCE_LOG_MESSAGES = {
  GETTING_STATS: 'Getting connection statistics',
  CHECKING_USER_ONLINE: (userId: string) =>
    `Checking if user ${userId} is online`,
  SENDING_ONLINE_USERS: 'Sending online users information',
  SENDING_USER_STATUS: (userId: string) =>
    `Sending online status for user ${userId}`,
};
