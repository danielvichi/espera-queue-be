import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserQueueDto, UserQueueDto } from './user-queue.dto';
import { defaultUserQueueExceptionsMessage } from './user-queue.exceptions';

@Injectable()
export class UserQueueService {
  constructor(private readonly prismaService: PrismaService) {}

  async createUserQueue(data: CreateUserQueueDto): Promise<UserQueueDto> {
    const existingUserQueue = await this.prismaService.userQueued.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingUserQueue) {
      throw new Error(defaultUserQueueExceptionsMessage.EMAIL_ALREADY_EXISTS);
    }

    return await this.prismaService.userQueued.create({
      data,
    });
  }
}
