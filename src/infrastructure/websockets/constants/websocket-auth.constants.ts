export const AUTH_MESSAGES = {
  CONNECTION_WITHOUT_TOKEN: (clientId: string) =>
    `Connection attempt without auth token: ${clientId}`,
  ERROR_VERIFYING_AUTH: (error: string) =>
    `Error verifying auth credentials: ${error}`,
};

export const DEFAULT_VALUES = {
  USER_ID: 'anonymous-user',
  USERNAME: 'Anonymous',
};
