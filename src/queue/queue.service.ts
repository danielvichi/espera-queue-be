import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto, QueueDto } from './queue.dto';
import {
  checkCreateQueueRequirementsOrThrow,
  checkQueueAndClientIdRequirementOrThrow,
} from './queue.utils';
import { ClientNotFoundException } from 'src/client/client.exceptions';
import { UnityNotFoundException } from 'src/unity/unity.exceptions';
import { defaultQueueExceptionsMessage } from './queue.exceptions';

interface GetQueuesByIdsArgs {
  queueIds: string[];
  clientId: string;
}

interface UpdateQueueArgs {
  queueId: string;
  clientId: string;
  payload: Partial<CreateQueueDto>;
}

@Injectable()
export class QueueService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   *  Create a Queue for a unity
   *
   * @param {CreateQueueDto} data
   * @returns {Promise<QueueDto>} Return a promise with the data of the Queue object created
   */
  async createQueue(data: CreateQueueDto): Promise<QueueDto> {
    checkCreateQueueRequirementsOrThrow(data);

    const client = await this.prismaService.client.findFirst({
      where: {
        id: data.clientId,
      },
    });

    if (!client) {
      throw new ClientNotFoundException(data.clientId);
    }

    const unity = await this.prismaService.unity.findFirst({
      where: {
        id: data.unityId,
      },
    });

    if (!unity) {
      throw new UnityNotFoundException(data.unityId);
    }

    const queueResponse = await this.prismaService.queue.create({
      data,
    });

    return {
      ...queueResponse,
      name: queueResponse.name ?? undefined,
      adminId: queueResponse.adminId ?? undefined,
      minWaitingTimeInMinutes:
        queueResponse.minWaitingTimeInMinutes ?? undefined,
      maxWaitingTimeInMinutes:
        queueResponse.maxWaitingTimeInMinutes ?? undefined,
      currentWaitingTimeInMinutes:
        queueResponse.currentWaitingTimeInMinutes ?? undefined,
    };
  }

  /**
   * Return a list of Queue by its Ids from a Client
   *
   * @param {GetQueuesByIdsArgs} data List of Queue Ids and the Client Id it all belongs
   * @returns {Promise<QueueDto[]} Return a list of Queue data
   */
  async getQueuesByIds(data: GetQueuesByIdsArgs): Promise<QueueDto[]> {
    if (!data.clientId) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
      );
    }

    if (!data.queueIds || data.queueIds.length === 0) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    const queueList = Promise.all(
      data.queueIds.map(async (queueId) => {
        const queueResponse = await this.prismaService.queue.findFirst({
          where: {
            id: queueId,
            AND: {
              clientId: data.clientId,
            },
          },
        });

        if (queueResponse) {
          return {
            ...queueResponse,
            name: queueResponse?.name ?? undefined,
            adminId: queueResponse?.adminId ?? undefined,
            minWaitingTimeInMinutes:
              queueResponse.minWaitingTimeInMinutes ?? undefined,
            maxWaitingTimeInMinutes:
              queueResponse.maxWaitingTimeInMinutes ?? undefined,
            currentWaitingTimeInMinutes:
              queueResponse.currentWaitingTimeInMinutes ?? undefined,
          };
        }
      }),
    );

    const filteredQueueList = (await queueList).filter(
      (queue) => queue !== undefined,
    );

    return filteredQueueList;
  }

  /**
   * Updates and returns a Queue
   *
   * @param {UpdateQueueArgs} data
   * @returns {Promise<QueueDto>}
   */
  async updateQueue(data: UpdateQueueArgs): Promise<QueueDto> {
    checkQueueAndClientIdRequirementOrThrow(data);

    if (!data.payload || Object.keys(data.payload).length === 0) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.PAYLOAD_REQUIRED,
      );
    }

    try {
      const updatedQueue = await this.prismaService.queue.update({
        where: {
          id: data.queueId,
          AND: {
            clientId: data.clientId,
          },
        },
        data: data.payload,
      });

      return {
        ...updatedQueue,
        name: updatedQueue.name ?? undefined,
        adminId: updatedQueue.adminId ?? undefined,
        minWaitingTimeInMinutes:
          updatedQueue.minWaitingTimeInMinutes ?? undefined,
        maxWaitingTimeInMinutes:
          updatedQueue.maxWaitingTimeInMinutes ?? undefined,
        currentWaitingTimeInMinutes:
          updatedQueue.currentWaitingTimeInMinutes ?? undefined,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Add Logger
    } catch (err) {
      throw new NotFoundException(
        defaultQueueExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }
  }

  /**
   * Disable a Queue for a given Client
   *
   * @param  {queueId: string; clientId: string } data
   * @returns {Promise<QueueDto>}
   */
  async disableQueue(data: {
    queueId: string;
    clientId: string;
  }): Promise<QueueDto> {
    checkQueueAndClientIdRequirementOrThrow(data);

    try {
      const disabledQueue = await this.prismaService.queue.update({
        where: {
          id: data.queueId,
          AND: {
            clientId: data.clientId,
            enabled: true,
          },
        },
        data: {
          enabled: false,
        },
      });

      return {
        ...disabledQueue,
        name: disabledQueue.name ?? undefined,
        adminId: disabledQueue.adminId ?? undefined,
        minWaitingTimeInMinutes:
          disabledQueue.minWaitingTimeInMinutes ?? undefined,
        maxWaitingTimeInMinutes:
          disabledQueue.maxWaitingTimeInMinutes ?? undefined,
        currentWaitingTimeInMinutes:
          disabledQueue.currentWaitingTimeInMinutes ?? undefined,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Add Logger
    } catch (err) {
      throw new NotFoundException(
        defaultQueueExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }
  }

  /**
   * Enables a Queue for a given Client
   *
   * @param {queueId: string; clientId: string } data
   * @returns {Promise<QueueDto>}
   */
  async enableQueue(data: {
    queueId: string;
    clientId: string;
  }): Promise<QueueDto> {
    checkQueueAndClientIdRequirementOrThrow(data);

    try {
      const enabledQueue = await this.prismaService.queue.update({
        where: {
          id: data.queueId,
          AND: {
            clientId: data.clientId,
            enabled: false,
          },
        },
        data: {
          enabled: true,
        },
      });

      return {
        ...enabledQueue,
        name: enabledQueue.name ?? undefined,
        adminId: enabledQueue.adminId ?? undefined,
        minWaitingTimeInMinutes:
          enabledQueue.minWaitingTimeInMinutes ?? undefined,
        maxWaitingTimeInMinutes:
          enabledQueue.maxWaitingTimeInMinutes ?? undefined,
        currentWaitingTimeInMinutes:
          enabledQueue.currentWaitingTimeInMinutes ?? undefined,
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Add Logger
    } catch (err) {
      throw new NotFoundException(
        defaultQueueExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }
  }
}
