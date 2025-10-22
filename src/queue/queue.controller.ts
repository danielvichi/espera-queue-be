import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateQueueDto, QueueDto } from './queue.dto';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { checkAdminRoleHigherOrThrow } from 'src/utils/roles.utils';
import { AdminRole } from '@prisma/client';
import { checkAdminAllowedToCreateQueueOrThrow } from './queue.utils';
import { QueueService } from './queue.service';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Create a Unity for the connected user with proper Admin Role',
    type: QueueDto,
  })
  async createQueue(
    @Body() inputData: Omit<CreateQueueDto, 'clientId'>,
    @Request() req: AuthenticatedRequestDto,
  ): Promise<QueueDto> {
    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.UNITY_ADMIN,
    });

    checkAdminAllowedToCreateQueueOrThrow({
      queueUnityId: inputData.unityId,
      authenticatedUser: req.user,
    });

    const queueResponse = await this.queueService.createQueue({
      ...inputData,
      clientId: req.user.clientId as string,
    });

    return queueResponse;
  }
}
