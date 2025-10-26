import {
  BadRequestException,
  Body,
  Controller,
  Get,
  MethodNotAllowedException,
  NotFoundException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateQueueDto, QueueDto } from './queue.dto';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { checkAdminRoleHigherOrThrow } from 'src/utils/roles.utils';
import { AdminRole } from '@prisma/client';
import {
  checkAdminAllowedToAccessQueueMethodOrThrow,
  checkQueueAndClientIdRequirementOrThrow,
} from './queue.utils';
import { QueueService } from './queue.service';
import { defaultQueueExceptionsMessage } from './queue.exceptions';
import { QueueUnityAdminVerifier } from './queue.admin.verifier';

interface UpdateQueueArgs {
  queueId: string;
  payload: Partial<Omit<CreateQueueDto, 'clientId' | 'queueId'>>;
}

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Retrieve a list of Queue by its Ids',
    type: QueueDto,
    isArray: true,
  })
  async getQueueByIds(
    @Body() queueIds: string[],
    @Request() req: AuthenticatedRequestDto,
  ): Promise<QueueDto[]> {
    if (!queueIds || queueIds.length === 0) {
      throw new BadRequestException(
        defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.UNITY_ADMIN,
    });

    queueIds.forEach((queueId) => {
      checkAdminAllowedToAccessQueueMethodOrThrow({
        queueUnityId: queueId,
        authenticatedUser: req.user,
      });
    });

    // should also include CLIENT ID
    const queueList = await this.queueService.getQueuesByIds({
      queueIds,
      clientId: req.user.clientId,
    });

    return queueList;
  }

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Create a Queue for the connected user with proper Admin Role',
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

    checkAdminAllowedToAccessQueueMethodOrThrow({
      queueUnityId: inputData.unityId,
      authenticatedUser: req.user,
    });

    const queueResponse = await this.queueService.createQueue({
      ...inputData,
      clientId: req.user.clientId,
    });

    return queueResponse;
  }

  @Post('update')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description:
      'Updated a Queue for the connected user with proper Admin Role >= Unity Admin',
    type: QueueDto,
  })
  async updateQueue(
    @Body() inputData: UpdateQueueArgs,
    @Request() req: AuthenticatedRequestDto,
  ) {
    checkQueueAndClientIdRequirementOrThrow({
      queueId: inputData.queueId,
      clientId: req.user.clientId,
    });

    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.UNITY_ADMIN,
    });

    const queueResponse = await this.queueService.updateQueue({
      queueId: inputData.queueId,
      clientId: req.user.clientId,
      payload: inputData.payload,
    });

    return queueResponse;
  }

  @Post('disable')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description:
      'Disable a Queue by its Id for a connected Admin >= Unity Admin',
    type: QueueDto,
  })
  async disableQueue(
    @Body() data: { queueId: string },
    @Request() req: AuthenticatedRequestDto,
  ) {
    checkQueueAndClientIdRequirementOrThrow({
      queueId: data.queueId,
      clientId: req.user.clientId,
    });

    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.UNITY_ADMIN,
    });

    try {
      // CHECK QUEUE IS UNDER ADMIN UNITY
      const verifier = new QueueUnityAdminVerifier(
        this.queueService,
        req.user,
        data.queueId,
      );

      await verifier.verify();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Method not allowed')) {
        throw new MethodNotAllowedException(err.message);
      }

      throw new Error(err);
    }

    try {
      return await this.queueService.disableQueue({
        queueId: data.queueId,
        clientId: req.user.clientId,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('required')) {
        throw new BadRequestException(err.message);
      } else if (
        err instanceof Error &&
        err.name.includes('NotFoundException')
      ) {
        throw new NotFoundException(err.message);
      }

      throw new Error(err);
    }
  }

  @Post('enable')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description:
      'Enable a Queue by its Id for a connected Admin >= Unity Admin',
    type: QueueDto,
  })
  async enable(
    @Body() data: { queueId: string },
    @Request() req: AuthenticatedRequestDto,
  ) {
    checkQueueAndClientIdRequirementOrThrow({
      queueId: data.queueId,
      clientId: req.user.clientId,
    });

    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.UNITY_ADMIN,
    });

    try {
      // CHECK QUEUE IS UNDER ADMIN UNITY
      const verifier = new QueueUnityAdminVerifier(
        this.queueService,
        req.user,
        data.queueId,
      );

      await verifier.verify();
    } catch (err) {
      if (err instanceof Error && err.message.includes('Method not allowed')) {
        throw new MethodNotAllowedException(err.message);
      }

      throw new Error(err);
    }

    try {
      return await this.queueService.enableQueue({
        queueId: data.queueId,
        clientId: req.user.clientId,
      });
    } catch (err) {
      if (err instanceof Error && err.message.includes('required')) {
        throw new BadRequestException(err.message);
      } else if (
        err instanceof Error &&
        err.name.includes('NotFoundException')
      ) {
        throw new NotFoundException(err.message);
      }

      throw new Error(err);
    }
  }
}
