import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  defaultQueueUserExceptionsMessage,
  QueuedUserBadRequestException,
  QueuedUserConflictException,
  QueuedUserNotFoundException,
} from './queued-user-exceptions';
import { QueuedUserStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { QueuedUserDto } from './queued-user-dto';
import normalizeNullIntoUndefined from 'src/utils/normalize-null';

@Injectable()
export class QueuedUserService {
  constructor(private readonly prismaService: PrismaService) {}

  async createQueuedUserEntry(
    queueId: string,
    userId: string,
    numberOfSeats: number,
  ): Promise<QueuedUserDto> {
    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    if (!userId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.USER_ID_REQUIRED,
      );
    }

    if (!numberOfSeats || numberOfSeats < 1) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.VALID_NUMBER_OF_SEATS_REQUIRED,
      );
    }

    const queue = await this.prismaService.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      throw new QueuedUserNotFoundException(
        defaultQueueUserExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const isAlreadyQueued = await this.prismaService.queuedUser.findFirst({
      where: {
        userId,
        status: QueuedUserStatus.WAITING,
      },
    });

    if (isAlreadyQueued) {
      const queuedUserData = DateTime.fromJSDate(isAlreadyQueued.createdAt);
      const { year, month, day } = queuedUserData;
      const isSameDay =
        year === now.getFullYear() &&
        month === now.getMonth() + 1 &&
        day === now.getDate();

      if (isSameDay) {
        throw new QueuedUserConflictException(
          defaultQueueUserExceptionsMessage.USER_ALREADY_QUEUED,
        );
      }
    }

    if (queue.startQueueAt) {
      const [startHours, startMinutes] = queue.startQueueAt
        .split(':')
        .map(Number);
      const startTime = startHours * 60 + startMinutes;

      if (currentTime < startTime) {
        throw new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.OUTSIDE_QUEUE_WORKING_HOURS,
        );
      }
    }

    if (queue.endQueueAt) {
      const [endHours, endMinutes] = queue.endQueueAt.split(':').map(Number);
      const endTime = endHours * 60 + endMinutes;

      if (currentTime > endTime) {
        throw new Error('Cannot queue user after queue operating hours');
      }
    }

    const createQueuedUserResponse = await this.prismaService.queuedUser.create(
      {
        data: {
          queueId,
          userId,
          status: QueuedUserStatus.WAITING,
          numberOfSeats,
        },
      },
    );

    const formattedResponse: QueuedUserDto = normalizeNullIntoUndefined(
      createQueuedUserResponse,
    );

    return formattedResponse;
  }

  // async getQueuedUserForQueue(queueId: string, userId: string): Promise<{}> {
  //   // Implementation goes here
  //   return {};
  // }

  // async serveQueuedUser(queueId: string, userId: string): Promise<{}> {
  //   // Implementation goes here
  //   return {};
  // }

  // async cancelQueuedUser(queueId: string, userId: string): Promise<{}> {
  //   // Implementation goes here
  //   return {};
  // }

  // // async deleteQueuedUser(queueId: string, userId: string): Promise<void> {
  // //   // Implementation goes here
  // // }

  // async getQueuedUsersInQueue(queueId: string): Promise<{}[]> {
  //   // Implementation goes here
  //   return [];
  // }
}
