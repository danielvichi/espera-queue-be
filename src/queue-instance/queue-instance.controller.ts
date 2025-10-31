import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueueInstanceService } from './queue-instance.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { defaultQueueInstanceExceptionsMessage } from './queue-instance.execeptions';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';

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
}
