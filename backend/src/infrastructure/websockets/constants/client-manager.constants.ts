export const CLIENT_MESSAGES = {
  CLIENT_REGISTERED: (clientId: string, userId: string) =>
    `Cliente registrado: ${clientId}, userId: ${userId}`,
  CLIENT_REMOVED: (clientId: string, userId: string) =>
    `Cliente removido: ${clientId}, userId: ${userId}`,
  CLIENT_NOT_FOUND: (clientId: string) => `Cliente não encontrado: ${clientId}`,
  CLIENT_JOINED_ROOM: (clientId: string, roomId: string) =>
    `Cliente ${clientId} entrou na sala ${roomId}`,
  CLIENT_LEFT_ROOM: (clientId: string, roomId: string) =>
    `Cliente ${clientId} saiu da sala ${roomId}`,
  USERNAME_UPDATED: (clientId: string, username: string) =>
    `Username atualizado para ${clientId}: ${username}`,
  ERROR_OPERATION: (operation: string, error: string) =>
    `Erro durante operação ${operation}: ${error}`,
};

export const CLIENT_ERRORS = {
  USERNAME_REQUIRED: 'Username is required',
  CLIENT_NOT_FOUND: 'Cliente não encontrado',
  ROOM_NOT_FOUND: 'Sala não encontrada',
  ERROR_GETTING_USERS_IN_ROOM: (roomId: string, error: string) =>
    `Erro ao obter usuários da sala ${roomId}: ${error}`,
};
