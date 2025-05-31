export const NOTIFICATION_MESSAGES = {
  SERVER_NOT_SET:
    'Server instance not set. Call setServer before using notification methods.',
  ERROR_NOTIFYING: (event: string, error: string) =>
    `Error sending ${event} notification: ${error}`,
};
