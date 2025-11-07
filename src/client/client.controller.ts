import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ClientDto, CreateClientWithAdminDto } from './client.dto';
import { checkCreateClientWithAdminRequirementsOrThrowError } from './client.utils';
import { AdminService } from 'src/admin/admin.service';
import { AuthService } from 'src/auth/auth.service';
import {
  defaultAuthExceptionMessage,
  UserNotFoundException,
} from 'src/auth/auth.exceptions';
import { type Response } from 'express';
import { createClientBadRequestExceptionMessages } from './client.exceptions';
import { AdminDto } from 'src/admin/admin.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@ApiTags('Client')
@Controller('client')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Get('all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiOkResponse({
    description: 'List of all clients',
    type: [ClientDto],
    isArray: true,
  })
  async getAllClients() {
    return this.clientService.getAllClients();
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth('AuthGuard')
  @ApiOkResponse({
    description: 'Get a client by ID',
    type: ClientDto,
  })
  @ApiQuery({
    name: 'clientId',
    type: String,
    description: 'client',
    required: true,
  })
  async getClientById(@Query('clientId') clientId: string) {
    const responsePayload = await this.clientService.getClientById(clientId);

    return responsePayload;
  }

  @Post('create-and-signin')
  @ApiBody({
    type: CreateClientWithAdminDto,
    required: true,
  })
  @ApiCreatedResponse({
    description:
      'Create a new Client and its Owner Admin account and create Auth Session',
    type: ClientDto,
  })
  async createClientAndSignin(
    @Body() createClientData: CreateClientWithAdminDto,
    @Req() req,
    @Res() res: Response,
  ) {
    // 1 - Check Input Data
    checkCreateClientWithAdminRequirementsOrThrowError(createClientData);
    const { admin: createAdminData, ...createClientDataOnly } =
      createClientData;

    // 2- Creates Client
    const clientResponse =
      await this.clientService.createClient(createClientDataOnly);

    if (!clientResponse.id) {
      throw new Error(
        createClientBadRequestExceptionMessages.SOMETHING_WENT_WRONG,
      );
    }

    let formattedClient: ClientDto;
    let admin: AdminDto | null = null;

    try {
      // 3 - Creates Client Owner Admin attached Client Id
      admin = await this.adminService.createOwnerAdmin({
        ...createAdminData,
        clientId: clientResponse.id,
      });

      if (!admin.id) {
        await this.adminService.deleteAdmin(admin.email);
        throw new Error(
          createClientBadRequestExceptionMessages.SOMETHING_WENT_WRONG,
        );
      }

      // 4 - Assign Owner Admin to Client ownerId
      const updatedClient = await this.clientService.updateClient(
        clientResponse.id,
        {
          ownerId: admin.id,
        },
      );

      formattedClient = {
        ...updatedClient,
        address: updatedClient.address ?? undefined,
        phone: updatedClient.phone ?? undefined,
      };
    } catch (err) {
      // 4.5 - Revert Admin creation in case something fails
      if (admin) {
        await this.adminService.deleteAdmin(admin.email);
      }

      throw new Error(
        createClientBadRequestExceptionMessages.SOMETHING_WENT_WRONG,
        err,
      );
    }

    const { email, passwordHash } = createAdminData;

    // 5 - Create auth session
    const user = await this.authService.checkAdminCredentials({
      email,
      passwordHash,
    });

    if (!user) {
      throw new UserNotFoundException(
        defaultAuthExceptionMessage.USER_NOT_FOUNDED,
      );
    }

    const signedJwt = await this.authService.generateJwtForUser({
      ...user,
      client: formattedClient,
    });
    const cookie = this.authService.generateJwtCookie(req, signedJwt);

    res.setHeader('Set-Cookie', cookie);
    return res.send(formattedClient);
  }
}
