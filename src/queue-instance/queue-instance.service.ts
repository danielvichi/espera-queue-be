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
import { isToday } from 'src/utils/date.utils';

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
   * @param {queueId: string } queueId - The ID of the queue
   * @returns {Promise<QueueInstanceDto>} - The created queue instance data
   */
  async addQueueInstance(data: { queueId: string }): Promise<QueueInstanceDto> {
    const queueReference = await this.prismaService.queue.findFirst({
      where: {
        id: data.queueId,
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
          queueId: data.queueId,
        },
      });

    if (lastExistingQueueInstanceForThisQueue) {
      const now = DateTime.now();

      const lastQueueInstanceDate = DateTime.fromISO(
        lastExistingQueueInstanceForThisQueue.createdAt.toISOString(),
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
        queueId: data.queueId,
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

      const isQueueInstanceFromToday = isToday({
        date: queueInstance.createdAt,
      });
      const isUserInQueue = queueInstance?.usersInQueue.includes(data.userId);

      if (isQueueInstanceFromToday && isUserInQueue) {
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

  /**
   * Find the last Queue Instance by QueueId
   *
   * @param {queueId: string;} data -
   * @returns {Promise<QueueInstanceDto>}
   */
  async getLastQueueInstanceByQueueId(data: {
    queueId: string;
  }): Promise<QueueInstanceDto> {
    const queueReference = await this.prismaService.queue.findFirst({
      where: {
        id: data.queueId,
      },
    });

    if (!queueReference) {
      throw new NotFoundException(
        defaultQueueInstanceExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    const queueInstanceResponse =
      await this.prismaService.queueInstance.findMany({
        where: {
          queueId: queueReference?.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

    if (!queueInstanceResponse || queueInstanceResponse.length === 0) {
      throw new NotFoundException(
        defaultQueueInstanceExceptionsMessage.QUEUE_INSTANCE_NOT_FOUND,
      );
    }

    const lastQueueInstance = queueInstanceResponse[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...lastQueueInstanceWithoutId } = lastQueueInstance;

    return {
      ...queueReference,
      ...lastQueueInstanceWithoutId,
      queueInstanceId: lastQueueInstance.id,
      queueId: lastQueueInstance.queueId,
    };
  }

  /**
   * Find today Queue Instance by QueueId, if it doesn't exist it creates a new one
   *
   * @param {queueId: string;} data -
   * @returns {Promise<QueueInstanceDto>}
   */
  async getTodayQueueInstanceByQueueId(data: {
    queueId: string;
  }): Promise<QueueInstanceDto> {
    const lastQueueInstance = await this.getLastQueueInstanceByQueueId({
      queueId: data.queueId,
    });

    const isTodayInstance = isToday({
      date: lastQueueInstance.createdAt,
    });

    if (!isTodayInstance) {
      throw new NotFoundException(
        defaultQueueInstanceExceptionsMessage.QUEUE_INSTANCE_NOT_FOUND,
      );
    }

    return lastQueueInstance;
  }
}
