import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueueInstanceDto } from './queue-instance.dto';
import {
  defaultQueueInstanceExceptionsMessage,
  QueueInstanceNotFoundException,
  UserAlreadyInQueueException,
  UserNotFoundException,
  UserNotInQueueException,
} from './queue-instance.execeptions';
import { DateTime } from 'luxon';

interface IsUserAlreadyInUnityQueueArgs {
  userId: string;
  unityId: string;
}
interface ModifyUserToQueueArgs {
  queueInstanceId: string;
  userId: string;
}

@Injectable()
export class QueueInstanceService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new queue instance
   *
   * @param {string} queueId - The ID of the queue
   * @returns {Promise<QueueInstanceDto>} - The created queue instance data
   */
  async addQueueInstance(queueId: string): Promise<QueueInstanceDto> {
    const queueReference = await this.prismaService.queue.findFirst({
      where: {
        id: queueId,
      },
    });

    if (!queueReference) {
      throw new NotFoundException(
        defaultQueueInstanceExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    const lastExistingQueueInstanceForThisQueue =
      await this.prismaService.queueInstance.findFirst({
        where: {
          queueId,
        },
      });

    if (lastExistingQueueInstanceForThisQueue) {
      const now = DateTime.now();

      const lastQueueInstanceDate = DateTime.fromISO(
        lastExistingQueueInstanceForThisQueue.date.toISOString(),
      );
      const isThisYear = now.year === lastQueueInstanceDate.year;
      const isThisMonth = now.month === lastQueueInstanceDate.month;
      const isThisDay = now.day === lastQueueInstanceDate.day;

      if (isThisYear && isThisMonth && isThisDay) {
        throw new Error(
          defaultQueueInstanceExceptionsMessage.QUEUE_INSTANCE_ALREADY_CREATED,
        );
      }
    }

    const { id: queueReferenceId, ...queueReferenceWithoutId } = queueReference;

    const createdQueue = await this.prismaService.queueInstance.create({
      data: {
        date: new Date(),
        queueId,
      },
    });

    const { id: queueInstanceId, ...createdQueueWithoutId } = createdQueue;

    return {
      ...createdQueueWithoutId,
      queueInstanceId: queueInstanceId,
      ...queueReferenceWithoutId,
      queueId: queueReferenceId,
    };
  }

  /**
   * Get queue instance by ID
   *
   * @param {string} queueInstanceId - The ID of the queue instance
   * @returns {Promise<QueueInstanceDto>} - The queue instance data
   */
  async getQueueInstanceById(
    queueInstanceId: string,
  ): Promise<QueueInstanceDto> {
    const queueInstance = await this.prismaService.queueInstance.findUnique({
      where: {
        id: queueInstanceId,
      },
    });

    if (!queueInstance) {
      throw new QueueInstanceNotFoundException(queueInstanceId);
    }

    const queueReference = await this.prismaService.queue.findFirst({
      where: {
        id: queueInstance.queueId,
      },
    });

    if (!queueReference) {
      throw new NotFoundException(
        defaultQueueInstanceExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    const { id, ...queueInstanceWithoutId } = queueInstance;
    const { id: queueReferenceId, ...queueReferenceWithoutId } = queueReference;

    return {
      ...queueInstanceWithoutId,
      queueId: queueReferenceId,
      queueInstanceId: id,
      ...queueReferenceWithoutId,
    };
  }

  /**
   * Check if user is already in any queue of the specified unity at the same day
   *
   * @param {IsUserAlreadyInUnityQueueArgs} data - Data containing userId and unityId
   * @returns {Promise<boolean>} - Whether the user is already in any queue of the specified unity
   */
  async isUserAlreadyInUnityQueue(
    data: IsUserAlreadyInUnityQueueArgs,
  ): Promise<boolean> {
    const queuesForUnity = await this.prismaService.queue.findMany({
      where: {
        unityId: data.unityId,
      },
    });

    if (!queuesForUnity || queuesForUnity.length === 0) {
      return false;
    }

    for (const queue of queuesForUnity) {
      const queueInstance = await this.prismaService.queueInstance.findFirst({
        where: {
          queueId: queue.id,
        },
      });

      if (!queueInstance) {
        return false;
      }

      const queueCreationDate = DateTime.fromISO(
        queueInstance.createdAt.toISOString(),
      );

      const today = DateTime.now();

      const isThisYear = today.year === queueCreationDate.year;
      const isThisMonth = today.month === queueCreationDate.month;
      const isToday = today.day === queueCreationDate.day;
      const isUserInQueue = queueInstance?.usersInQueue.includes(data.userId);

      if (isThisYear && isThisMonth && isToday && isUserInQueue) {
        return true;
      }
    }

    return false;
  }

  /**
   * Add user to queue instance
   *
   * @param {ModifyUserToQueueArgs} data - Data containing queueInstanceId and userId
   * @returns {Promise<string[]>} Updated list of user IDs in the queue instance
   */
  async addUserToQueue(data: ModifyUserToQueueArgs): Promise<string[]> {
    const queueInstance = await this.getQueueInstanceById(data.queueInstanceId);

    if (!queueInstance) {
      throw new QueueInstanceNotFoundException(data.queueInstanceId);
    }

    const user = await this.prismaService.queueUser.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new UserNotFoundException(data.userId);
    }

    const isUserAlreadyInQueueInstanceForToday =
      await this.isUserAlreadyInUnityQueue({
        unityId: queueInstance.unityId,
        userId: data.userId,
      });

    if (isUserAlreadyInQueueInstanceForToday) {
      throw new UserAlreadyInQueueException({
        queueInstanceId: data.queueInstanceId,
        userId: data.userId,
      });
    }

    const updatedUsersInQueue = [...queueInstance.usersInQueue, data.userId];

    const updatedQueueInstance = await this.prismaService.queueInstance.update({
      where: {
        id: data.queueInstanceId,
      },
      data: {
        usersInQueue: updatedUsersInQueue,
      },
    });

    return updatedQueueInstance.usersInQueue;
  }

  async removeUserFromQueue(data: ModifyUserToQueueArgs): Promise<string[]> {
    const queueInstance = await this.getQueueInstanceById(data.queueInstanceId);

    if (!queueInstance) {
      throw new QueueInstanceNotFoundException(data.queueInstanceId);
    }

    const isUserInTheCurrentQueue = queueInstance.usersInQueue.includes(
      data.userId,
    );

    if (!isUserInTheCurrentQueue) {
      throw new UserNotInQueueException({
        queueInstanceId: queueInstance.queueInstanceId,
        userId: data.userId,
      });
    }

    const updateUsersInQueue = queueInstance.usersInQueue.filter(
      (userId) => userId !== data.userId,
    );

    const updatedAttendedUsersQueue = [
      ...queueInstance.attendedUsers,
      data.userId,
    ];

    const updatedQueueInstanceResponse =
      await this.prismaService.queueInstance.update({
        where: {
          id: queueInstance.queueInstanceId,
        },
        data: {
          usersInQueue: updateUsersInQueue,
          attendedUsers: updatedAttendedUsersQueue,
        },
      });

    return updatedQueueInstanceResponse.usersInQueue;
  }
}
