import {
  type INestApplicationContext,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected successfully.');
    } catch (error) {
      console.error('Error connecting to the database:', error);
    }
  }

  enableShutdownHooksFromContext(appContext: INestApplicationContext) {
    try {
      process.on('beforeExit', () => {
        console.log(
          'PrismaService.enableShutdownHooksFromContext, beforeExit event triggered',
        );
        void this.$disconnect();
        void appContext.close();
      });
    } catch (error) {
      console.error('Error setting up shutdown hooks in PrismaService:', error);
    }
  }
}
