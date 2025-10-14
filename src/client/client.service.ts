import { Injectable } from '@nestjs/common';
import {
  ClientDto,
  CreateClientDto,
  InputClientDto,
  InputResponseClientDto,
} from './client.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ClientNotFoundException,
  CreateClientBadRequestException,
  createClientBadRequestExceptionMessages,
} from './client.exceptions';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a new client in the database using the provided data.
   * @param {InputClientDto} data - The data required to create a new client.
   * @returns {Promise<ClientDto>} The created ClientDto object.
   **/
  async createClient(data: CreateClientDto): Promise<InputResponseClientDto> {
    if (!data.name) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.NAME_REQUIRED,
      );
    }

    if (!data.ownerId) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.OWNER_ID_REQUIRED,
      );
    }

    const existingClientWithSameOwnerId = await this.prisma.client.findFirst({
      where: { ownerId: data.ownerId },
    });

    if (existingClientWithSameOwnerId) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.CLIENT_WITH_SAME_OWNER_ID_EXISTS,
      );
    }

    const newClient = await this.prisma.client.create({
      data,
    });

    return {
      ...newClient,
      createdAt: newClient.createdAt,
      updatedAt: newClient.updatedAt,
      address: newClient.address ?? undefined,
      phone: newClient.phone ?? undefined,
    };
  }

  /**
   * Fetches all clients from the database and returns them as an array of ClientDto objects.
   * @returns {Promise<ClientDto[]>} An array of ClientDto objects representing all clients.
   **/
  async getAllClients(): Promise<ClientDto[]> {
    const clientsList = await this.prisma.client.findMany();

    const formattedClients: ClientDto[] = clientsList.map((client) => ({
      ...client,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      address: client.address ?? undefined,
      phone: client.phone ?? undefined,
    }));

    return formattedClients;
  }

  /**
   *  Fetches a client by its unique identifier (ID) from the database.
   *  @param {string} id - The unique identifier of the client to be fetched.
   *  @returns {Promise<ClientDto | null>} A ClientDto object if found, otherwise null.
   * **/
  async getClientById(id: string): Promise<ClientDto | null> {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new ClientNotFoundException(id);
    }

    return {
      ...client,
      address: client.address ?? undefined,
      phone: client.phone ?? undefined,
    };
  }

  /**
   * Updates a client by its unique identifier (ID) in the database.
   * @param {string} id - The unique identifier of the client to be updated.
   * @param {Partial<InputClientDto>} data - The data to update the client with.
   * @returns {Promise<ClientDto>} The updated ClientDto object.
   * **/
  async updateClient(id: string, data: Partial<InputClientDto>) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new ClientNotFoundException(id);
    }

    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  /**
   * Disables a client by its unique identifier (ID) from the database.
   * @param {string} id - The unique identifier of the client to be disabled.
   * @returns {Promise<ClientDto>} The disabled ClientDto object.
   * **/
  async disableClient(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new ClientNotFoundException(id);
    }

    if (!client.enabled) {
      throw new Error('Client is already disabled.');
    }

    return this.prisma.client.update({
      where: { id },
      data: { enabled: false },
    });
  }

  /**
   * Enables a disabled client by its unique identifier (ID) in the database.
   * @param {string} id - The unique identifier of the client to be enabled.
   * @returns {Promise<ClientDto>} The enabled ClientDto object.
   * **/
  async enableClient(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { enabled: true },
    });
  }
}
