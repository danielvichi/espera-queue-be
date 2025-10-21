import {
  Body,
  Controller,
  Get,
  MethodNotAllowedException,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UnityService, type UpdateUnityArgs } from './unity.service';
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

  @Get()
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get Unities by id that belongs to the connected user Client',
    type: UnityDto,
    isArray: true,
  })
  async getUnitiesById(
    @Body() data: { unitiesIds: string[] },
    @Request() req: AuthenticatedRequestDto,
  ): Promise<UnityDto[] | null> {
    if (!req.user.clientId) {
      throw new MethodNotAllowedException();
    }

    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.UNITY_ADMIN,
    });

    const unityListResponse = await this.unityService.getUnitiesByIds({
      unitiesIds: data.unitiesIds,
    });

    const filteredUnityListByClientId = unityListResponse.filter(
      (unity) => unity.clientId === req.user.clientId,
    );

    return filteredUnityListByClientId;
  }

  @Get('all')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description: 'Get all Unities for a Client',
    type: UnityDto,
    isArray: true,
  })
  async getAllUnities(
    @Request() req: AuthenticatedRequestDto,
  ): Promise<UnityDto[]> {
    if (!req.user.clientId) {
      throw new MethodNotAllowedException();
    }

    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.CLIENT_ADMIN,
    });

    const unityList = await this.unityService.getAllUnities({
      clientId: req.user.clientId,
    });

    return unityList;
  }

  @Post('disable')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description:
      'Disable a Enabled Unity for the connected user with proper Admin Role',
    type: UnityDto,
    isArray: true,
  })
  async disableUnity(
    @Body() data: { unityId: string },
    @Request() req: AuthenticatedRequestDto,
  ) {
    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.CLIENT_ADMIN,
    });

    const unity = await this.unityService.disableUnity({
      unityId: data.unityId,
    });

    return unity;
  }

  @Post('enable')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description:
      'Enable a Disabled Unity for the connected user with proper Admin Role',
    type: UnityDto,
    isArray: true,
  })
  async enableUnity(
    @Body() data: { unityId: string },
    @Request() req: AuthenticatedRequestDto,
  ) {
    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.CLIENT_ADMIN,
    });

    const unity = await this.unityService.enableUnity({
      unityId: data.unityId,
    });

    return unity;
  }

  @Post('update')
  @UseGuards(AuthGuard)
  @ApiOkResponse({
    description:
      'Update a Unity data for the connected user with proper Admin Role',
    type: UnityDto,
    isArray: true,
  })
  async updateUnity(
    @Body() payload: UpdateUnityArgs,
    @Request() req: AuthenticatedRequestDto,
  ) {
    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.CLIENT_ADMIN,
    });

    const unity = await this.unityService.updateUnity({
      unityId: payload.unityId,
      payload: payload.payload,
    });

    return unity;
  }
}
