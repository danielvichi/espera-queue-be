import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { type CreatedAdminDto } from './admin.dto';
import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  CreateAdminBadRequestException,
  createAdminBadRequestExceptionMessages,
} from './admin.exceptions';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Create a new client Owner Admin account',
  })
  async createNewNomOwnerAdmin(@Body() inputData: CreatedAdminDto) {
    // Check is nor creating Client Owner, that should be done through the create client flow
    if (inputData.role === AdminRole.CLIENT_OWNER) {
      throw new CreateAdminBadRequestException(
        createAdminBadRequestExceptionMessages.CLIENT_OWNER_CREATION,
      );
    }

    const newAdmin = await this.adminService.createAdmin(inputData);

    return newAdmin;
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get information for the connected account',
  })
  getProfile(@Request() req: AuthenticatedRequestDto) {
    return req.user;
  }
}
