import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { ChatEvents } from '../../../domain/protocols/websocket/messages.ws-events';
import { ConnectionHandlerService } from '../services/connection-handler.service';
import { RoomGateway } from './room.gateway';
import { MessageGateway } from './message.gateway';
import { TypingGateway } from './typing.gateway';
import { PresenceGateway } from './presence.gateway';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  private server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly connectionHandlerService: ConnectionHandlerService,
    private readonly roomGateway: RoomGateway,
    private readonly messageGateway: MessageGateway,
    private readonly typingGateway: TypingGateway,
    private readonly presenceGateway: PresenceGateway,
  ) {}

  afterInit(): void {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    await this.connectionHandlerService.handleConnection(client);
  }

  handleDisconnect(client: Socket): void {
    this.connectionHandlerService.handleDisconnect(client);
  }

  @SubscribeMessage(ChatEvents.JOIN_ROOM)
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; username?: string },
  ): void {
    this.roomGateway.handleJoinRoom(client, payload);
  }

  @SubscribeMessage(ChatEvents.LEAVE_ROOM)
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    this.roomGateway.handleLeaveRoom(client, payload);
  }

  @SubscribeMessage(ChatEvents.GET_ROOM_USERS)
  handleGetRoomUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    this.roomGateway.handleGetRoomUsers(client, payload);
  }

  @SubscribeMessage(ChatEvents.SEND_MESSAGE)
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; content: string },
  ): Promise<void> {
    await this.messageGateway.handleSendMessage(client, payload);
  }

  @SubscribeMessage(ChatEvents.TYPING)
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    this.typingGateway.handleTyping(client, payload);
  }

  @SubscribeMessage(ChatEvents.STOPPED_TYPING)
  handleStoppedTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ): void {
    this.typingGateway.handleStoppedTyping(client, payload);
  }

  @SubscribeMessage(ChatEvents.GET_ONLINE_USERS)
  handleGetOnlineUsers(@ConnectedSocket() client: Socket): void {
    this.presenceGateway.handleGetOnlineUsers(client);
  }

  @SubscribeMessage(ChatEvents.CHECK_USER_ONLINE)
  handleCheckUserOnline(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: string },
  ): void {
    this.presenceGateway.handleCheckUserOnline(client, payload);
  }
}
