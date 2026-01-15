import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  MethodNotAllowedException,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UnityService } from './unity.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateUnityDto,
  InputGetUnitiesByIdDto,
  InputUpdateUnityDto,
  UnityDto,
} from './unity.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { type AuthenticatedRequestDto } from 'src/auth/auth.dto';
import { checkAdminRoleHigherOrThrow } from 'src/utils/roles.utils';
import { AdminRole } from '@prisma/client';

@ApiTags('Unity')
@Controller('unity')
export class UnityController {
  constructor(private readonly unityService: UnityService) {}

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiBody({
    type: CreateUnityDto,
    required: true,
  })
  @ApiCreatedResponse({
    description: 'Create a Unity for the connected user with proper Admin Role',
    type: UnityDto,
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
  @ApiBearerAuth('AuthGuard')
  @ApiQuery({
    type: InputGetUnitiesByIdDto,
    required: true,
  })
  @ApiOkResponse({
    description:
      'Get Unities by id that belongs to the connected user Client and Admin Privileges',
    type: UnityDto,
    isArray: true,
  })
  async getUnitiesById(
    @Body() data: InputGetUnitiesByIdDto,
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

    // If the user is a UNITY_ADMIN, filter further by their allowed unity IDs
    if (req.user.role === AdminRole.UNITY_ADMIN) {
      const allowedUnityIds = req.user.unityIds || [];
      return filteredUnityListByClientId.filter((unity) =>
        allowedUnityIds.includes(unity.id),
      );
    }

    return filteredUnityListByClientId;
  }

  @Get('all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
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

  @Patch('disable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiOkResponse({
    description:
      'Disable a Enabled Unity for the connected user with proper Admin Role',
    type: UnityDto,
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

  @Patch('enable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiOkResponse({
    description:
      'Enable a Disabled Unity for the connected user with proper Admin Role',
    type: UnityDto,
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

  @Patch('update')
  @ApiBody({
    type: InputUpdateUnityDto,
  })
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiOkResponse({
    description:
      'Update a Unity data for the connected user with proper Admin Role',
    type: UnityDto,
  })
  async updateUnity(
    @Body() payload: InputUpdateUnityDto,
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

  @Delete('delete')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiCreatedResponse({
    description:
      'Delete a Unity by Id for the connected user with proper Admin Role',
    type: UnityDto,
  })
  async deleteUnity(
    @Body() data: { unityId: string },
    @Request() req: AuthenticatedRequestDto,
  ): Promise<UnityDto> {
    checkAdminRoleHigherOrThrow({
      userRole: req.user.role,
      minRequiredRole: AdminRole.CLIENT_ADMIN,
    });

    const unity = await this.unityService.deleteUnity(data);

    return unity;
  }
}
