import {
  BadRequestException,
  Body,
  Controller,
  MethodNotAllowedException,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueueInstanceService } from './queue-instance.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  defaultQueueInstanceExceptionsMessage,
  methodNotAllowedWithoutAdminRole,
} from './queue-instance.execeptions';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { checkAdminRoleHigherOrThrow } from 'src/utils/roles.utils';
import { AdminRole } from '@prisma/client';
import { AddUserToQueueInstanceDto } from './queue-instance.dto';

@ApiTags('Queue-Instance')
@Controller('queue-instance')
export class QueueInstanceController {
  constructor(private readonly queueInstanceService: QueueInstanceService) {}

  @Patch('add-user')
  @ApiBody({
    required: true,
    type: AddUserToQueueInstanceDto,
  })
  @ApiOkResponse({
    description: 'Add user to queue instance',
    type: Object,
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  async addQueueUserToQueueInstance(
    @Body() data: AddUserToQueueInstanceDto,
    @Request() req: AuthenticatedRequestDto,
  ): Promise<{ success: boolean }> {
    if (!data.queueId) {
      throw new BadRequestException(
        defaultQueueInstanceExceptionsMessage.QUEUE_ID,
      );
    }

    let queueInstanceId: string;

    const todayQueueInstance =
      await this.queueInstanceService.getTodayQueueInstanceByQueueId({
        queueId: data.queueId,
      });

    if (!todayQueueInstance) {
      const queueInstanceResponse =
        await this.queueInstanceService.addQueueInstance({
          queueId: data.queueId,
        });

      queueInstanceId = queueInstanceResponse.queueInstanceId;
    } else {
      queueInstanceId = todayQueueInstance.queueInstanceId;
    }

    const result = await this.queueInstanceService.addUserToQueue({
      queueInstanceId: queueInstanceId,
      userId: req.user.id,
    });

    return { success: result.includes(req.user.id) ? true : false };
  }

  @Patch('remove-user')
  @ApiOkResponse({
    description:
      'Remove user from queue instance (only proper admins can remove an userId witch is not the authenticatedUser one)',
    type: Object,
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
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
