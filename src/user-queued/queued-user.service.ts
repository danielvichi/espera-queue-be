import { Injectable, MethodNotAllowedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  defaultQueueUserExceptionsMessage,
  QueuedUserBadRequestException,
  QueuedUserConflictException,
  QueuedUserNotFoundException,
  QueueNotFoundException,
} from './queued-user-exceptions';
import { AdminRole, QueuedUserStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { QueuedUserDto } from './queued-user-dto';
import normalizeNullIntoUndefined from 'src/utils/normalize-null';
import { AdminWithClientDto } from 'src/admin/admin.dto';

@Injectable()
export class QueuedUserService {
  constructor(private readonly prismaService: PrismaService) {}

  /*
   * Create a new queued user entry
   *
   * @param queueId - The ID of the queue
   * @param userId - The ID of the user
   * @param numberOfSeats - The number of seats requested by the user
   * @returns The created queued user entry as a QueuedUserDto
   */
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

  /*
   * Get queued user entry for a specific queue and user
   *
   * @param queueId - The ID of the queue
   * @param userId - The ID of the user
   * @returns The queued user entry as a QueuedUserDto
   */
  async getQueuedUserForQueue(
    queueId: string,
    userId: string,
  ): Promise<QueuedUserDto | null> {
    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    if (!userId || userId === '') {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.USER_ID_REQUIRED,
      );
    }

    const queuedUser = await this.prismaService.queuedUser.findMany({
      where: {
        queueId,
        userId,
      },
    });

    const lastQueuedUserEntry = queuedUser[queuedUser.length - 1];

    if (!lastQueuedUserEntry) {
      return null;
    }

    const formattedResponse: QueuedUserDto =
      normalizeNullIntoUndefined(lastQueuedUserEntry);

    return formattedResponse;
  }

  /*
   * Serve a queued user
   *
   * @param queueId - The ID of the queue
   * @param userId - The ID of the user
   * @returns The updated queued user entry as a QueuedUserDto
   */
  async serveQueuedUser(
    queueId: string,
    queuedUserId: string,
  ): Promise<QueuedUserDto> {
    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    if (!queuedUserId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUED_USER_ID_REQUIRED,
      );
    }

    const queue = await this.prismaService.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      throw new QueueNotFoundException(queueId);
    }

    const queuedUserEntry = await this.prismaService.queuedUser.findFirst({
      where: { id: queuedUserId },
    });

    if (!queuedUserEntry) {
      throw new QueuedUserNotFoundException(queuedUserId);
    }

    if (queuedUserEntry.status !== QueuedUserStatus.WAITING) {
      throw new QueuedUserConflictException(
        defaultQueueUserExceptionsMessage.USER_CANNOT_BE_SERVED,
      );
    }

    const updatedQueuedUserEntry = await this.prismaService.queuedUser.update({
      where: { id: queuedUserEntry.id },
      data: {
        status: QueuedUserStatus.SERVICED,
        servedAt: new Date(),
      },
    });

    const formattedUpdatedQueuedUserEntry: QueuedUserDto =
      normalizeNullIntoUndefined(updatedQueuedUserEntry);

    return formattedUpdatedQueuedUserEntry;
  }

  // async cancelQueuedUser(queueId: string, userId: string): Promise<{}> {
  //   // Implementation goes here
  //   return {};
  // }

  // // async deleteQueuedUser(queueId: string, userId: string): Promise<void> {
  // //   // Implementation goes here
  // // }

  /*
   * Get all queued users for a specific queue
   *
   * @param queueId - The ID of the queue
   * @returns An array of QueuedUserDto entries
   */
  async getQueuedUsersForQueue(queueId: string): Promise<QueuedUserDto[]> {
    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    const queue = await this.prismaService.queue.findUnique({
      where: { id: queueId },
    });

    if (!queue) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    const queuedUsers = await this.prismaService.queuedUser.findMany({
      where: { queueId },
    });

    if (queuedUsers.length > 0) {
      const formattedResponse: QueuedUserDto[] = queuedUsers.map((queuedUser) =>
        normalizeNullIntoUndefined(queuedUser),
      );
      return formattedResponse;
    }

    return [];
  }

  /*
   * Check for Admin credentials check queueId privileges or throw error
   *
   * @param user - AdminWithClientDto object
   * @param queueId - Id from Queue
   * return null
   */
  async checkIsQueueAdminOrThrow(
    user: AdminWithClientDto,
    queueId: string,
  ): Promise<null> {
    if (!user.role) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.USER_ROLE_REQUIRED,
      );
    }

    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    const queueResponse = await this.prismaService.queue.findFirst({
      where: {
        id: queueId,
      },
    });

    if (!queueResponse) {
      throw new QueueNotFoundException(
        defaultQueueUserExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    // CHECK CLIENT ACCESS
    const isClientAdmin = queueResponse.clientId === user.clientId;

    if (!isClientAdmin) {
      throw new MethodNotAllowedException(
        defaultQueueUserExceptionsMessage.CLIENT_ADMIN_PRIVILEGE_REQUIRED,
      );
    }

    const isUnityAdmin = user.role === AdminRole.UNITY_ADMIN;

    // CHECK UNITY ADMIN ROLE AND UNITY ACCESS
    if (isUnityAdmin) {
      const hasUnityPrivilege = user.unityIds?.some(
        (unityId) => unityId === queueResponse.unityId,
      );

      if (!hasUnityPrivilege) {
        throw new MethodNotAllowedException(
          defaultQueueUserExceptionsMessage.UNITY_ADMIN_PRIVILEGE_REQUIRED,
        );
      }
    }

    // CHECK QUEUE ROLE AND QUEUE ACCESS
    const isQueueAdmin = user.role === AdminRole.QUEUE_ADMIN;

    if (isQueueAdmin) {
      const hasQueuesPrivileges = user.queueIds?.some(
        (currentQueueId) => currentQueueId === queueId,
      );

      if (!hasQueuesPrivileges) {
        throw new MethodNotAllowedException(
          defaultQueueUserExceptionsMessage.QUEUE_ADMIN_PRIVILEGE_REQUIRED,
        );
      }
    }

    return null;
  }
}
