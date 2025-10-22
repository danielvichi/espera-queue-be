import { Injectable } from '@nestjs/common';
import {
  ClientDto,
  CreateClientDto,
  CreateClientResponseDto,
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
   *
   * @param {CreateClientDto} data The data required to create a new client.
   * @returns {Promise<ClientDto>} The created ClientDto object.
   **/
  async createClient(data: CreateClientDto): Promise<CreateClientResponseDto> {
    if (!data.name) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.NAME_REQUIRED,
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
      ownerId: newClient.ownerId ?? undefined,
    };
  }

  /**
   * Fetches all clients from the database and returns them as an array of ClientDto objects.
   *
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
   *
   *  @param {string} id - The unique identifier of the client to be fetched.
   *  @returns {Promise<ClientDto | null>} A ClientDto object if found, otherwise null.
   * **/
  async getClientById(id: string): Promise<ClientDto | null> {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return null;
    }

    return {
      ...client,
      address: client.address ?? undefined,
      phone: client.phone ?? undefined,
    };
  }

  /**
   * Updates a client by its unique identifier (ID) in the database.
   *
   * @param {string} id - The unique identifier of the client to be updated.
   * @param {Partial<CreateClientDto>} data - The data to update the client with.
   * @returns {Promise<ClientDto>} The updated ClientDto object.
   * **/
  async updateClient(id: string, data: Partial<CreateClientDto>) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new ClientNotFoundException(id);
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        ...client,
        ...data,
      },
    });
  }

  /**
   * Disables a client by its unique identifier (ID) from the database.
   *
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
   *
   * @param {string} id - The unique identifier of the client to be enabled.
   * @returns {Promise<ClientDto>} The enabled ClientDto object.
   * **/
  async enableClient(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { enabled: true },
    });
  }

  /**
   * Deletes permanently an existing Client by its ID - WARNING its an irreversible action
   *
   * @param {string} id - The unique identifier of the client to be permanently deleted
   * @returns {Promise<ClientDTO>} The deleted ClientDto object.
   * **/
  async deleteClient(id: string): Promise<Partial<ClientDto>> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: id,
      },
    });

    if (!client) {
      throw new ClientNotFoundException(id);
    }

    const deleteResponse = await this.prisma.client.delete({
      where: {
        id: client.id,
      },
    });

    return {
      ...deleteResponse,
      address: deleteResponse.address ?? undefined,
      phone: deleteResponse.phone ?? undefined,
    };
  }
}
