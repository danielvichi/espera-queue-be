import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AdminDto, AdminWithClientDto, CreatedAdminDto } from './admin.dto';
import { AdminRole } from '@prisma/client';
import { AdminService } from './admin.service';
import {
  CreateAdminBadRequestException,
  createAdminBadRequestExceptionMessages,
} from './admin.exceptions';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiBody({
    type: CreatedAdminDto,
    required: true,
  })
  @ApiCreatedResponse({
    description: 'Create a new client Owner Admin account',
    type: AdminDto,
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
  @ApiBearerAuth('AuthGuard')
  @ApiOkResponse({
    description: 'Get information for the connected account',
    type: AdminWithClientDto,
  })
  getProfile(@Request() req: AuthenticatedRequestDto) {
    return req.user;
  }
}
