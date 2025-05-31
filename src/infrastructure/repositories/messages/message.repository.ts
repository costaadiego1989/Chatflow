import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Result, ResultHelper } from '../../../helpers/result-helper';
import {
  IMessageRepository,
  MessageData,
} from '../../../domain/ports/message-repository.interface';

@Injectable()
export class MessageRepository implements IMessageRepository {
  private readonly logger = new Logger(MessageRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    content: string;
    userId: string;
    roomId: string;
    type?: string;
    mediaUrl?: string;
    linkPreview?: string;
    replyToId?: string;
  }): Promise<Result<MessageData>> {
    try {
      const message = await this.prisma.message.create({
        data: {
          content: data.content,
          userId: data.userId,
          roomId: data.roomId,
          type: (data.type as any) || 'TEXT',
          mediaUrl: data.mediaUrl,
          linkPreview: data.linkPreview,
          replyToId: data.replyToId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      return ResultHelper.success(message as unknown as MessageData);
    } catch (error) {
      return this._handleError(error, 'Error to create message');
    }
  }

  async findByRoomId(
    roomId: string,
    limit = 50,
    offset = 0,
  ): Promise<Result<MessageData[]>> {
    try {
      const messages = await this.prisma.message.findMany({
        where: {
          roomId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      return ResultHelper.success(messages as unknown as MessageData[]);
    } catch (error) {
      return this._handleError(error, 'Error to find messages by room id');
    }
  }

  async findById(id: string): Promise<Result<MessageData | null>> {
    try {
      const message = await this.prisma.message.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      return ResultHelper.success(message as unknown as MessageData);
    } catch (error) {
      return this._handleError(error, 'Error to find message by id');
    }
  }

  async update(
    id: string,
    data: Partial<MessageData>,
  ): Promise<Result<MessageData>> {
    try {
      const message = await this.prisma.message.update({
        where: { id },
        data: {
          content: data.content,
          type: data.type as any,
          mediaUrl: data.mediaUrl,
          linkPreview: data.linkPreview,
          isRead: data.isRead,
          reactions: data.reactions,
          deletedAt: data.deletedAt,
          editedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      return ResultHelper.success(message as unknown as MessageData);
    } catch (error) {
      return this._handleError(error, 'Error to update message');
    }
  }

  async delete(id: string): Promise<Result<MessageData>> {
    try {
      const message = await this.prisma.message.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      });
      return ResultHelper.success(message as unknown as MessageData);
    } catch (error) {
      return this._handleError(error, 'Error to delete message');
    }
  }

  private _handleError(error: any, message: string) {
    this.logger.error(`Error to ${message}: ${error.message}`);
    return ResultHelper.failure(`Error to ${message}: ${error.message}`);
  }
}
