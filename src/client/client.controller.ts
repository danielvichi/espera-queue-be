import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { ClientService } from './client.service';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
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

@Controller('client')
export class ClientController {
  constructor(
    private readonly clientService: ClientService,
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Get('all')
  @ApiOkResponse({
    description: 'List of all clients',
    type: ClientDto,
    isArray: true,
  })
  async getAllClients() {
    return this.clientService.getAllClients();
  }

  @Get()
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

  @Post('create')
  @ApiOkResponse({
    description: 'Create a new Client and its Owner Admin account',
    type: String,
  })
  async createClient(
    @Body() createClientData: CreateClientWithAdminDto,
    @Req() req,
    @Res() res: Response,
  ) {
    checkCreateClientWithAdminRequirementsOrThrowError(createClientData);
    const { admin: createAdminData, ...createClientDataOnly } =
      createClientData;

    const admin = await this.adminService.createOwnerAdmin({
      ...createAdminData,
    });

    if (!admin.id) {
      await this.adminService.deleteAdmin(admin.email);
      throw new Error(
        createClientBadRequestExceptionMessages.SOMETHING_WENT_WRONG,
      );
    }

    let formattedClient: ClientDto;

    try {
      const clientResponse = await this.clientService.createClient({
        ...createClientDataOnly,
        ownerId: admin.id,
      });

      if (!clientResponse.id) {
        throw new Error(
          createClientBadRequestExceptionMessages.SOMETHING_WENT_WRONG,
        );
      }

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
      await this.adminService.deleteAdmin(admin.email);
      throw new Error(
        createClientBadRequestExceptionMessages.SOMETHING_WENT_WRONG,
        err,
      );
    }

    const { email, passwordHash } = createAdminData;

    // Login
    const user = await this.authService.adminSignIn({
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
    return res.send();
  }
}
