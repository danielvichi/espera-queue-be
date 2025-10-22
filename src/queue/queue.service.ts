import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto, QueueDto } from './queue.dto';
import { checkCreateQueueRequirementsOrThrow } from './queue.utils';
import { ClientNotFoundException } from 'src/client/client.exceptions';
import { UnityNotFoundException } from 'src/unity/unity.exceptions';
import { defaultQueueExceptionsMessage } from './queue.exceptions';

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

  async getQueuesByIds(queueIds: string[]): Promise<QueueDto[]> {
    if (!queueIds || queueIds.length === 0) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    const queueList = Promise.all(
      queueIds.map(async (queueId) => {
        const queueResponse = await this.prismaService.queue.findFirst({
          where: {
            id: queueId,
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
}
