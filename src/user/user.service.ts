import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UserDto } from './user.dto';
import { defaultQueueUserExceptionsMessage } from './user.exceptions';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createQueueUser(data: CreateUserDto): Promise<UserDto> {
    const existingUserQueue = await this.prismaService.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingUserQueue) {
      throw new Error(defaultQueueUserExceptionsMessage.EMAIL_ALREADY_EXISTS);
    }

    return await this.prismaService.user.create({
      data,
    });
  }
}
