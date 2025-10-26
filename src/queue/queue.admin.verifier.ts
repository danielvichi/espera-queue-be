import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminWithClientDto } from 'src/admin/admin.dto';
import { QueueService } from './queue.service';
import {
  defaultQueueExceptionsMessage,
  QueueMethodNotAllowedException,
} from './queue.exceptions';
import { AdminRole } from '@prisma/client';

/**
 * Verify if aimed Queue is under Admin privileges
 */
export class QueueUnityAdminVerifier {
  constructor(
    private readonly queueService: QueueService,
    private readonly authenticatedUser: AdminWithClientDto,
    private readonly queueId: string,
  ) {}

  async verify() {
    const queueList = await this.queueService.getQueuesByIds({
      queueIds: [this.queueId],
      clientId: this.authenticatedUser.clientId,
    });

    if (!queueList || queueList.length === 0) {
      throw new NotFoundException(
        defaultQueueExceptionsMessage.QUEUE_NOT_FOUND,
      );
    }

    // It should return only one Queue
    const queueUnity = queueList[0];

    // Client Owner / Admin can manage all Client queues
    const isClientOwnerOrClientAdmin =
      this.authenticatedUser.role === AdminRole.CLIENT_OWNER ||
      this.authenticatedUser.role === AdminRole.CLIENT_ADMIN;

    if (isClientOwnerOrClientAdmin) {
      return true;
    }

    // Check if Unity Admin can manage Queue
    if (
      !this.authenticatedUser.unityIds ||
      this.authenticatedUser.unityIds?.length === 0
    ) {
      throw new BadRequestException();
    }

    const isAllowed = this.authenticatedUser.unityIds.includes(queueUnity.id);

    if (!isAllowed) {
      throw new QueueMethodNotAllowedException({
        adminName: this.authenticatedUser.name,
        adminId: this.authenticatedUser.id,
      });
    }

    return true;
  }
}
