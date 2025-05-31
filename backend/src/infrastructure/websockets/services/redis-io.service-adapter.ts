import { INestApplicationContext, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter>;

  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
  ) {
    super(app);
  }

  private readonly MESSAGE_REDIS_CONNECTED = 'Connected to Redis for WebSocket';
  private readonly MESSAGE_REDIS_ADAPTER_APPLIED =
    'Redis adapter applied to Socket.IO server';
  private readonly MESSAGE_REDIS_ADAPTER_NOT_AVAILABLE =
    'Redis adapter not available';

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url:
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient);
    this.logger.log(this.MESSAGE_REDIS_CONNECTED);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log(this.MESSAGE_REDIS_ADAPTER_APPLIED);
    } else {
      this.logger.warn(this.MESSAGE_REDIS_ADAPTER_NOT_AVAILABLE);
    }
    return server;
  }
}
