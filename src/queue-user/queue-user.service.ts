import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueUserDto, QueueUserDto } from './queue-user.dto';
import { defaultQueueUserExceptionsMessage } from './queue-user.exceptions';

@Injectable()
export class QueueUserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createQueueUser(data: CreateQueueUserDto): Promise<QueueUserDto> {
    const existingUserQueue = await this.prismaService.queueUser.findFirst({
      where: {
        email: data.email,
      },
    });

    console.log('======================================');
    console.log('Existing User Queue:', existingUserQueue);

    if (existingUserQueue) {
      throw new Error(defaultQueueUserExceptionsMessage.EMAIL_ALREADY_EXISTS);
    }

    return await this.prismaService.queueUser.create({
      data,
    });
  }
}
