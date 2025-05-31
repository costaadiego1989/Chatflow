import { Result } from '../../helpers/result-helper';

export interface MessageData {
  id?: string;
  content: string;
  userId: string;
  roomId: string;
  type?: string;
  mediaUrl?: string;
  linkPreview?: string;
  replyToId?: string;
  isRead?: boolean;
  reactions?: any;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  editedAt?: Date;
}

export interface IMessageRepository {
  create(data: {
    content: string;
    userId: string;
    roomId: string;
    type?: string;
    mediaUrl?: string;
    linkPreview?: string;
    replyToId?: string;
  }): Promise<Result<MessageData>>;

  findByRoomId(
    roomId: string,
    limit?: number,
    offset?: number,
  ): Promise<Result<MessageData[]>>;

  findById(id: string): Promise<Result<MessageData | null>>;

  update(id: string, data: Partial<MessageData>): Promise<Result<MessageData>>;

  delete(id: string): Promise<Result<MessageData>>;
}
