import { Module } from '@nestjs/common';
import { ChatGateway } from '../websockets/gateways/chat.gateway';
import { ChatEventService } from '../../application/services/chat-event.service';
import { TypingNotificationService } from '../../application/services/typing-notification.service';
import { ChatOrchestrationService } from '../../application/services/chat-orchestration.service';
import { WebsocketServicesModule } from './websocket-services.module';
import { RoomGateway } from '../websockets/gateways/room.gateway';
import { MessageGateway } from '../websockets/gateways/message.gateway';
import { TypingGateway } from '../websockets/gateways/typing.gateway';
import { PresenceGateway } from '../websockets/gateways/presence.gateway';

@Module({
  imports: [WebsocketServicesModule],
  providers: [
    ChatGateway,
    RoomGateway,
    MessageGateway,
    TypingGateway,
    PresenceGateway,
    ChatEventService,
    TypingNotificationService,
    ChatOrchestrationService,
  ],
  exports: [
    ChatGateway,
    RoomGateway,
    MessageGateway,
    TypingGateway,
    PresenceGateway,
    TypingNotificationService,
  ],
})
export class WebsocketModule {}
