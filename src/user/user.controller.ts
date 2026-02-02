import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto, UserDto } from './user.dto';
import { checkCreateQueueUserRequirementsOrThrow } from './user.utils';
import { AuthService } from 'src/auth/auth.service';
import { UserNotFoundException } from 'src/auth/auth.exceptions';
import { type Response } from 'express';
import { defaultQueueUserExceptionsMessage } from './user.exceptions';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly queueUserService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('create-and-signin')
  @ApiResponse({
    description: 'Create a new Queue User and create Auth Session',
    status: 201,
    type: UserDto,
  })
  async createQueueUser(
    @Body() createUserData: CreateUserDto,
    @Req() req,
    @Res() res: Response,
  ) {
    checkCreateQueueUserRequirementsOrThrow(createUserData);

    // 1 - Create Queue User
    let userResponse;

    try {
      userResponse =
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

    const signedJwt = await this.authService.generateJwtForUser(userResponse);

    const cookie = this.authService.generateJwtCookie(req, signedJwt);

    res.setHeader('Set-Cookie', cookie);
    return res.send();
  }
}
