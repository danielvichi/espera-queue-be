// import { TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ClientNotFoundException,
  CreateClientBadRequestException,
  createClientBadRequestExceptionMessages,
} from './client.exceptions';
import { ClientService } from './client.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';

const CLIENTS_MOCK_DATA = [
  {
    name: 'Client Serv A',
    address: 'Client address in the client format.',
    phone: '+1-234-567-8900',
    email: 'valid_email_serv_a@email.com',
  },
  {
    name: 'Client Serv B',
    address: 'Client address in the client format.',
    phone: '+1-234-567-8900',
    email: 'valid_emai_serv_bl@email.com',
  },
  {
    name: 'Client Serv C',
    address: 'Client address in the client format.',
    phone: '+1-234-567-8900',
    email: 'valid_emai_serv_cl@email.com',
  },
];

describe('ClientService', () => {
  let clientService: ClientService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    clientService = module.get<ClientService>(ClientService);
    prismaService = module.get<PrismaService>(PrismaService);

    await TestModuleSingleton.cleanUpDatabase();
  });

  it('should be defined', () => {
    expect(clientService).toBeDefined();
  });

  it('should not be able to create a client with missing name', async () => {
    const passwordHash = 'a_secure_password_hash_123';
    await expect(
      clientService.createClient({
        name: '',
        email: 'some_valid@email.com',
        passwordHash,
      }),
    ).rejects.toThrow(
      new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.NAME_REQUIRED,
      ),
    );
  });

  it('should not be able to create a client with missing email', async () => {
    const passwordHash = 'a_secure_password_hash_123';
    await expect(
      clientService.createClient({
        name: 'Valid Name',
        email: '',
        passwordHash,
      }),
    ).rejects.toThrow(
      new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.EMAIL_REQUIRED,
      ),
    );
  });

  it('should not be able to create a client with missing passwordHash', async () => {
    await expect(
      clientService.createClient({
        name: 'Valid Name',
        email: 'some_valid@email.com',
        passwordHash: '',
      }),
    ).rejects.toThrow(
      new CreateClientBadRequestException(
        createClientBadRequestExceptionMessages.PASSWORD_HASH_REQUIRED,
      ),
    );
  });

  it('should not be able to create a client with invalid email', async () => {
    const passwordHash = 'a_secure_password_hash_123';
    const clientMockData = CLIENTS_MOCK_DATA[0];

    await expect(
      clientService.createClient({
        ...clientMockData,
        email: 'invalid_email_format',
        passwordHash,
      }),
    ).rejects.toThrow('Invalid email format.');
  });

  it('should not be able to create a client with short password hash', async () => {
    const passwordHash = 'short';
    const clientMockData = CLIENTS_MOCK_DATA[0];

    await expect(
      clientService.createClient({
        ...clientMockData,
        passwordHash,
      }),
    ).rejects.toThrow(
      'Password hash is too short, must be at least 16 characters long.',
    );
  });

  it('should be able to create and retrieve clients', async () => {
    const passwordHash = 'a_secure_password_hash_123';
    const clientMockData = CLIENTS_MOCK_DATA[0];

    // Create 1 client
    const newClient_1 = await clientService.createClient({
      ...clientMockData,
      passwordHash,
    });

    expect(newClient_1.id).toBeDefined();
    expect(newClient_1.email).toMatch(clientMockData.email);
    expect(newClient_1.passwordHash).toMatch(passwordHash);
    expect(newClient_1.name).toMatch(clientMockData.name);
    expect(newClient_1.phone).toMatch(clientMockData.phone);

    const clients = await clientService.getAllClients();
    const matchedClient = clients.filter(
      (client) => client.email === clientMockData.email,
    );

    expect(Array.isArray(clients)).toBe(true);
    expect(matchedClient.length).toBe(1);
    expect(matchedClient[0].email).toMatch(clientMockData.email);
    expect(matchedClient[0].name).toMatch(clientMockData.name);
    expect(matchedClient[0].phone).toMatch(clientMockData.phone);
  });

  it('should not be able to create a client with the same email', async () => {
    const passwordHash = 'a_secure_password_hash_123';
    const clientMockData = CLIENTS_MOCK_DATA[1];
    clientMockData.email = CLIENTS_MOCK_DATA[0].email; // same email as the first client

    await expect(
      clientService.createClient({
        ...clientMockData,
        passwordHash,
      }),
    ).rejects.toThrow(
      `Client with ${clientMockData.email} email already exists.`,
    );
  });

  it('should return an Array with Client A', async () => {
    const clients = await clientService.getAllClients();

    const matchClient = clients.filter((client) => {
      if (client.email === CLIENTS_MOCK_DATA[0].email) {
        return client;
      }
    });

    expect(Array.isArray(clients)).toBe(true);
    expect(matchClient.length).toBe(1);
  });

  it('should throw a known error if client id does not exist', async () => {
    const invalidId = 'non_existing_id_123';

    await expect(clientService.getClientById(invalidId)).rejects.toThrow(
      new ClientNotFoundException(invalidId),
    );
  });

  it('should return a client by ID', async () => {
    const validId = 'c_serv_123e4567';
    const clientMockData = CLIENTS_MOCK_DATA[2];

    await prismaService.client.create({
      data: {
        id: validId,
        ...clientMockData,
        passwordHash: 'a_secure_password_hash_123',
      },
    });

    const clientResponse = await clientService.getClientById(validId);

    expect(clientResponse).toBeDefined();
    expect(clientResponse?.id).toBe(validId);
    expect(clientResponse?.email).toBe(clientMockData.email);
  });

  it('should disable an existing enabled client', async () => {
    const clientMockData = CLIENTS_MOCK_DATA[1];

    let existingClient = await prismaService.client.findFirst({
      where: { email: clientMockData.email },
    });

    if (!existingClient) {
      existingClient = await prismaService.client.create({
        data: {
          ...clientMockData,
          passwordHash: 'a_secure_password_hash_123',
        },
      });
    }

    expect(existingClient.enabled).toBe(true);

    const disabledClient = await clientService.disableClient(existingClient.id);

    expect(disabledClient.enabled).toBe(false);
  });

  it('should re-enable a disabled client', async () => {
    let disabledClient = await prismaService.client.findFirst({
      where: { enabled: false },
    });

    if (!disabledClient) {
      disabledClient = await prismaService.client.findFirst({
        where: { enabled: true },
      });

      if (!disabledClient) {
        throw new Error('No enabled Client founded');
      }

      disabledClient = await clientService.disableClient(disabledClient?.id);
    }

    expect(disabledClient.enabled).toBe(false);

    const reEnabledClient = await clientService.enableClient(disabledClient.id);

    expect(reEnabledClient.enabled).toBe(true);
  });

  it('should update client data', async () => {
    const existingClient = await clientService.getAllClients();

    if (existingClient.length === 0) {
      throw new Error('Not client found, it should have at least one');
    }

    const newAddress = 'new test address';

    const updatedClient = clientService.updateClient(existingClient[0].id, {
      address: newAddress,
    });

    expect((await updatedClient).address).toBe(newAddress);
  });
});
