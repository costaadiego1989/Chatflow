import { Module } from '@nestjs/common';
import { WebsocketAuthService } from '../websockets/services/websocket-auth.service';
import { NotificationService } from '../websockets/services/notification.service';
import { RoomOperationsService } from '../websockets/services/room-operations.service';
import { ClientManagerService } from '../websockets/services/client-manager.service';
import { ChatEventService } from '../../application/services/chat-event.service';
import { TypingNotificationService } from '../../application/services/typing-notification.service';
import { PrismaService } from '../database/prisma.service';
import { ConnectionHandlerService } from '../websockets/services/connection-handler.service';
import { MessageRepository } from '../repositories/messages/message.repository';
import { ChatOrchestrationService } from '../../application/services/chat-orchestration.service';

@Module({
  imports: [],
  providers: [
    PrismaService,
    WebsocketAuthService,
    NotificationService,
    ClientManagerService,
    ChatEventService,
    TypingNotificationService,
    RoomOperationsService,
    ConnectionHandlerService,
    MessageRepository,
    ChatOrchestrationService,
  ],
  exports: [
    WebsocketAuthService,
    NotificationService,
    ClientManagerService,
    ChatEventService,
    TypingNotificationService,
    RoomOperationsService,
    ConnectionHandlerService,
    MessageRepository,
    ChatOrchestrationService,
  ],
})
export class WebsocketServicesModule {}
