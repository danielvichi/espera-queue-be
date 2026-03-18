import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueuedUserService } from './queued-user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import {
  defaultQueueUserExceptionsMessage,
  QueuedUserBadRequestException,
  QueuedUserForbiddenException,
} from './queued-user-exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueuedUserDto } from './queued-user-dto';

@ApiTags('Queued User')
@Controller('queued-user')
export class QueuedUserController {
  constructor(
    private readonly queuedUserService: QueuedUserService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiResponse({
    description: 'Create a new Queued User entry',
    status: 201,
  })
  async createQueuedUserEntry(
    @Body()
    body: {
      queueId: string;
      numberOfSeats: number;
    },
    @Request() req: AuthenticatedRequestDto,
  ) {
    const { queueId, numberOfSeats } = body;
    const userId = req.user.id;

    return this.queuedUserService.createQueuedUserEntry(
      queueId,
      userId,
      numberOfSeats,
    );
  }

  @Patch('serve')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiResponse({
    description: 'Serve a Queued User',
    status: 200,
  })
  async serveQueuedUserEntry(
    @Request() req: AuthenticatedRequestDto,
    @Body() body: { queueId: string; queuedUserId: string },
  ) {
    const admin = req.user;
    const { queueId, queuedUserId } = body;

    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    if (!queuedUserId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUED_USER_ID_REQUIRED,
      );
    }

    if (!admin.role) {
      throw new QueuedUserForbiddenException(
        defaultQueueUserExceptionsMessage.ADMIN_PRIVILEGE_REQUIRED,
      );
    }

    await this.queuedUserService.checkIsQueueAdminOrThrow(admin, queueId);

    return this.queuedUserService.serveQueuedUser(queueId, queuedUserId);
  }

  @Get('by-queue-last-session')
  @ApiQuery({
    name: 'queueId',
    type: String,
    description: 'Queue Id to fetch the queued users from its last session',
    required: true,
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiResponse({
    description: 'List of Queued Users for the Queue last session',
    status: 200,
  })
  async getQueuedUsersForQueueActiveSession(
    @Request() req: AuthenticatedRequestDto,
  ): Promise<QueuedUserDto[]> {
    const admin = req.user;
    const queueId = req.query.queueId as string;

    if (!queueId) {
      throw new QueuedUserBadRequestException(
        defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
      );
    }

    await this.queuedUserService.checkIsQueueAdminOrThrow(admin, queueId);

    return this.queuedUserService.getQueuedUsersForQueueActiveSession(queueId);
  }
}
