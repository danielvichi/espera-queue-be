import {
  BadRequestException,
  Body,
  Controller,
  MethodNotAllowedException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueueInstanceService } from './queue-instance.service';
import { ApiOkResponse } from '@nestjs/swagger';
import {
  defaultQueueInstanceExceptionsMessage,
  methodNotAllowedWithoutAdminRole,
} from './queue-instance.execeptions';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { checkAdminRoleHigherOrThrow } from 'src/utils/roles.utils';
import { AdminRole } from '@prisma/client';

@Controller('queue-instance')
export class QueueInstanceController {
  constructor(private readonly queueInstanceService: QueueInstanceService) {}

  @Post('add-user')
  @ApiOkResponse({
    description: 'Add user to queue instance',
    type: Object,
  })
  @UseGuards(AuthGuard)
  async addQueueUserToQueueInstance(
    @Body() data: { queueInstanceId: string },
    @Request() req: AuthenticatedRequestDto,
  ): Promise<{ success: boolean }> {
    if (!data.queueInstanceId) {
      throw new BadRequestException(
        defaultQueueInstanceExceptionsMessage.QUEUE_INSTANCE_ID_REQUIRED,
      );
    }

    const result = await this.queueInstanceService.addUserToQueue({
      queueInstanceId: data.queueInstanceId,
      userId: req.user.id,
    });

    return { success: result.includes(req.user.id) ? true : false };
  }

  @Post('remove-user')
  @ApiOkResponse({
    description:
      'Remove user from queue instance (only proper admins can remove an userId witch is not the authenticatedUser one)',
    type: Object,
  })
  @UseGuards(AuthGuard)
  async removeQueueUserFromQueueInstance(
    @Body() data: { queueInstanceId: string; userId: string },
    @Request() req: AuthenticatedRequestDto,
  ): Promise<{ success: boolean }> {
    if (!data.queueInstanceId) {
      throw new BadRequestException(
        defaultQueueInstanceExceptionsMessage.QUEUE_INSTANCE_ID_REQUIRED,
      );
    }

    if (!data.userId) {
      throw new BadRequestException(
        defaultQueueInstanceExceptionsMessage.USER_ID_REQUIRED,
      );
    }

    const isTargetUserTheSameAsCredentials = req.user.id === data.userId;

    if (!isTargetUserTheSameAsCredentials && !req.user.role) {
      throw new MethodNotAllowedException(methodNotAllowedWithoutAdminRole);
    }

    if (!isTargetUserTheSameAsCredentials) {
      checkAdminRoleHigherOrThrow({
        minRequiredRole: AdminRole.UNITY_ADMIN,
        userRole: req.user.role,
      });
    }

    const result = await this.queueInstanceService.removeUserFromQueue({
      queueInstanceId: data.queueInstanceId,
      userId: data.userId,
    });

    return { success: !result.includes(req.user.id) ? true : false };
  }
}
