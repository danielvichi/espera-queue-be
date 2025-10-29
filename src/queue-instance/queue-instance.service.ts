import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueueInstanceDto } from './queue-instance.dto';
import { defaultQueueInstanceExceptionsMessage } from './queue-instance.execeptions';
import { DateTime } from 'luxon';

@Injectable()
export class QueueInstanceService {
  constructor(private readonly prismaService: PrismaService) {}

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

  // async addUserToQueue(
  //   queueInstanceId: string,
  //   userId: string,
  // ): Promise<void> {}
}
