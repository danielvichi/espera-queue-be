import { ClientController } from './client.controller';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { PrismaService } from 'src/prisma/prisma.service';

const CLIENTS_MOCK_DATA = [
  {
    name: 'Client Controller A',
    address: 'Client address in the client format.',
    phone: '+1-234-567-8900',
    ownerId: 'owner_123e4567',
  },
  {
    name: 'Client Controller B',
    address: 'Client address in the client format.',
    phone: '+1-234-567-8900',
    ownerId: 'owner_123e45678',
  },
  {
    name: 'Client Controller C',
    address: 'Client address in the client format.',
    phone: '+1-234-567-8900',
    ownerId: 'owner_123e456789',
  },
];

describe('ClientController', () => {
  let controller: ClientController;
  let prismaService: PrismaService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    controller = module.get<ClientController>(ClientController);

    prismaService = module.get<PrismaService>(PrismaService);
    await TestModuleSingleton.cleanUpDatabase();

    // Create a client to be used in tests
    const clientMock1 = CLIENTS_MOCK_DATA[0];
    await prismaService.client.create({
      data: {
        ...clientMock1,
      },
    });
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return an Array with Clients', async () => {
    const clients = await controller.getAllClients();

    const matchClient = clients.filter((client) => {
      if (client.name === CLIENTS_MOCK_DATA[0].name) {
        return client;
      }
    });

    expect(Array.isArray(clients)).toBe(true);
    expect(matchClient.length).toBe(1);
  });

  it('should return a client by ID', async () => {
    const customId = '123e4567';
    const clientMockData = CLIENTS_MOCK_DATA[2];
    await prismaService.client.create({
      data: {
        id: customId,
        ...clientMockData,
      },
    });

    const clientResponse = await controller.getClientById(customId);

    expect(clientResponse).toBeDefined();
    expect(clientResponse?.id).toBe(customId);
  });
});
