import { Controller, Get, Query } from '@nestjs/common';
import { ClientService } from './client.service';
import { ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { ClientDto } from './client.dto';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

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
}
