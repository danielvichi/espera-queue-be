import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { QueueUserService } from './queue-user.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateQueueUserDto, QueueUserDto } from './queue-user.dto';
import { checkCreateQueueUserRequirementsOrThrow } from './queue-user.utils';
import { AuthService } from 'src/auth/auth.service';
import { UserNotFoundException } from 'src/auth/auth.exceptions';
import { type Response } from 'express';
import { defaultQueueUserExceptionsMessage } from './queue-user.exceptions';

@ApiTags('Queue-User')
@Controller('queue-user')
export class QueueUserController {
  constructor(
    private readonly queueUserService: QueueUserService,
    private readonly authService: AuthService,
  ) {}

  @Post('create-and-signin')
  @ApiResponse({
    description: 'Create a new Queue User and create Auth Session',
    status: 201,
    type: QueueUserDto,
  })
  async createQueueUser(
    @Body() createUserData: CreateQueueUserDto,
    @Req() req,
    @Res() res: Response,
  ) {
    checkCreateQueueUserRequirementsOrThrow(createUserData);

    // 1 - Create Queue User
    let queueUserResponse;

    try {
      queueUserResponse =
        await this.queueUserService.createQueueUser(createUserData);
    } catch (error: unknown) {
      if (error instanceof UserNotFoundException) {
        throw error;
      } else if (
        error instanceof Error &&
        error.message.includes(
          defaultQueueUserExceptionsMessage.EMAIL_ALREADY_EXISTS,
        )
      ) {
        throw new BadRequestException(error.message);
      } else {
        throw error; // re-throw other unexpected errors
      }
    }

    const signedJwt =
      await this.authService.generateJwtForUser(queueUserResponse);

    const cookie = this.authService.generateJwtCookie(req, signedJwt);

    res.setHeader('Set-Cookie', cookie);
    return res.send();
  }
}
