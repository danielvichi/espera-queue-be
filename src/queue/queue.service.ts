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
import normalizeNullIntoUndefined from 'src/utils/normalize-null';

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

    return normalizeNullIntoUndefined<QueueDto>(queueResponse);
  }

  /**
   * Return a list of Queue by its Unity Id from a Client
   *
   * @param {unityId: string; clientId: string } data
   * @returns {Promise<QueueDto[]>} Return a list of Queue data
   */
  async getQueuesByUnityId(data: {
    unityId: string;
    clientId: string;
  }): Promise<QueueDto[]> {
    if (!data.unityId) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.UNITY_ID_REQUIRED,
      );
    }

    if (!data.clientId) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
      );
    }

    const queueList = await this.prismaService.queue.findMany({
      where: {
        unityId: data.unityId,
        clientId: data.clientId,
      },
    });

    const parsedQueueList: QueueDto[] = queueList.map((queue) =>
      normalizeNullIntoUndefined<QueueDto>(queue),
    );

    return parsedQueueList;
  }

  /**
   * Return a list of Queue by its Ids from a Client
   *
   * @param {GetQueuesByIdsArgs} data List of Queue Ids and the Client Id it all belongs
   * @returns {Promise<QueueDto[]>} Return a list of Queue data
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
            AND: [
              { id: queueId },
              {
                clientId: data.clientId,
              },
            ],
          },
        });

        if (queueResponse) {
          return normalizeNullIntoUndefined<QueueDto>(queueResponse);
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

      return normalizeNullIntoUndefined<QueueDto>(updatedQueue);

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

      return normalizeNullIntoUndefined<QueueDto>(disabledQueue);

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

      return normalizeNullIntoUndefined<QueueDto>(enabledQueue);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Add Logger
    } catch (err) {
      throw new NotFoundException(
        defaultQueueExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }
  }
}
