import { Injectable } from '@nestjs/common';
import {
  ClientDto,
  InputClientDto,
  InputClientResponseDto,
} from './client.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { isValidEmail } from 'src/utils/emailParser';
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
  async createClient(data: InputClientDto): Promise<InputClientResponseDto> {
    if (!data.name) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.NAME_REQUIRED,
      );
    }
    if (!data.email) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.EMAIL_REQUIRED,
      );
    }
    if (!data.passwordHash) {
      throw new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.PASSWORD_HASH_REQUIRED,
      );
    }

    // Normalize and validate email
    data.email = data.email.toLowerCase().trim();
    if (!isValidEmail(data.email)) {
      throw new Error('Invalid email format.');
    }

    const emailExists = await this.prisma.client.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error(`Client with ${emailExists.email} email already exists.`);
    }

    if (data.passwordHash.length < 16) {
      throw new Error(
        'Password hash is too short, must be at least 16 characters long.',
      );
    }

    const newClient = await this.prisma.client.create({
      data: {
        name: data.name,
        address: data.address ?? null,
        phone: data.phone ?? null,
        email: data.email,
        passwordHash: data.passwordHash,
      },
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
      email: client.email ?? undefined,
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
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
      address: client.address ?? undefined,
      phone: client.phone ?? undefined,
      email: client.email ?? undefined,
    };
  }

  /**
   * Updates a client by its unique identifier (ID) in the database.
   * @param {string} id - The unique identifier of the client to be updated.
   * @param {Partial<InputClientDto>} data - The data to update the client with.
   * @returns {Promise<ClientDto>} The updated ClientDto object.
   * **/
  async updateClient(id: string, data: Partial<InputClientDto>) {
    if (data.email) {
      throw new Error('Email cannot be updated.');
    }

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
