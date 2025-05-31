export interface ClientData {
  userId: string;
  username: string;
  rooms?: Set<string>;
}

export interface MessageData {
  content: string;
  authorId: string;
  id?: string;
  roomId?: string;
  createdAt?: Date;
}

export interface AuthUser {
  userId: string;
  username: string;
  email?: string;
  token?: string;
}
