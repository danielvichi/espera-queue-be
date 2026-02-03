import {
  Body,
  Controller,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueuedUserService } from './queued-user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import {
  defaultQueueUserExceptionsMessage,
  QueuedUserBadRequestException,
  QueuedUserForbiddenException,
} from './queued-user-exceptions';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
