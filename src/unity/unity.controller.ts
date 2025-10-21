import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { UnityService } from './unity.service';
import { ApiOkResponse } from '@nestjs/swagger';
import { CreateUnityDto, UnityDto } from './unity.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { checkAdminRoleHigherOrThrow } from 'src/utils/roles.utils';
import { AdminRole } from '@prisma/client';

@Controller('unity')
export class UnityController {
  constructor(private readonly unityService: UnityService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Create a Unity for the connected user with proper Admin Role',
    type: UnityDto,
    isArray: true,
  })
  async createUnity(
    @Body() inputData: CreateUnityDto,
    @Request() req: AuthenticatedRequestDto,
  ): Promise<UnityDto> {
    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.CLIENT_ADMIN,
    });

    const unity = await this.unityService.createUnity(inputData);

    return unity;
  }
}
