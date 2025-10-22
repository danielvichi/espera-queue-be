import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto, QueueDto } from './queue.dto';
import { checkCreateQueueRequirementsOrThrow } from './queue.utils';
import { ClientNotFoundException } from 'src/client/client.exceptions';
import { UnityNotFoundException } from 'src/unity/unity.exceptions';

@Injectable()
export class QueueService {
  constructor(private readonly prismaService: PrismaService) {}

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
      UserQueue: [],
    };
  }
}
