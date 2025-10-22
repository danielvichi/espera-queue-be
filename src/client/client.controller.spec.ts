import { ClientController } from './client.controller';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminWithClientDto, CreateOwnerAdminDto } from 'src/admin/admin.dto';
import { JwtService } from '@nestjs/jwt';
import { AdminService } from 'src/admin/admin.service';

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

const CLIENT_OWNER_ADMIN_MOCK_DATA: Array<
  Omit<CreateOwnerAdminDto, 'clientId'>
> = [
  {
    name: 'Owner Admin 1',
    email: 'owner_admin_1@email.com',
    passwordHash: 'somePasswordHash',
  },
];

describe('ClientController', () => {
  let clientController: ClientController;
  let adminService: AdminService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    clientController = module.get<ClientController>(ClientController);
    adminService = module.get<AdminService>(AdminService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
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
    expect(clientController).toBeDefined();
  });

  describe('/client/all', () => {
    it('should return an Array with Clients', async () => {
      const response = await TestModuleSingleton.callEndpoint()
        .get('/client/all')
        .send()
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.length).toBe(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body[0].name).toBe(CLIENTS_MOCK_DATA[0].name);
    });
  });

  describe('/client/create', () => {
    it('should throw a BadRequestException if Client Name is missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding name on propose
      const { name, ...createClientMockDataWithoutName } = CLIENTS_MOCK_DATA[2];
      const adminMockData = CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockDataWithoutName,
          admin: adminMockData,
        })
        .expect(400);
    });

    it('should throw a BadRequestException if Client Admin Name is missing', async () => {
      const createClientMockData = CLIENTS_MOCK_DATA[2];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding name on propose
      const { name, ...adminMockDataWithoutName } =
        CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockData,
          admin: adminMockDataWithoutName,
        })
        .expect(400);
    });

    it('should throw a BadRequestException if Client Admin Email is missing', async () => {
      const createClientMockData = CLIENTS_MOCK_DATA[2];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding name on propose
      const { email, ...adminMockDataWithoutEmail } =
        CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockData,
          admin: adminMockDataWithoutEmail,
        })
        .expect(400);
    });

    it('should throw a BadRequestException if Client Admin Email is invalid ', async () => {
      const createClientMockData = CLIENTS_MOCK_DATA[2];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding name on propose
      const { email, ...adminMockDataWithoutEmail } =
        CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockData,
          admin: {
            ...adminMockDataWithoutEmail,
            email: 'invalid_email',
          },
        })
        .expect(400);
    });

    it('should throw a BadRequestException if Client Admin Password is missing', async () => {
      const createClientMockData = CLIENTS_MOCK_DATA[2];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding name on propose
      const { passwordHash, ...adminMockDataWithoutPassword } =
        CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockData,
          admin: adminMockDataWithoutPassword,
        })
        .expect(400);
    });

    it('should REVERT admin creation if it fails to create Client', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding name on propose
      const { name, ...createClientMockDataWithoutName } = CLIENTS_MOCK_DATA[2];
      const createAdminMockData = CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockDataWithoutName,
          admin: createAdminMockData,
        })
        .expect(400);

      const admin = await adminService.findAdminByEmail(
        createAdminMockData.email,
      );

      expect(admin).toBeNull();
    });

    it('should create Client and its Owner admin with a valid login session', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- excluding ownerId on propose
      const { ownerId, ...createClientMockData } = CLIENTS_MOCK_DATA[2];
      const createAdminMockData = CLIENT_OWNER_ADMIN_MOCK_DATA[0];

      const response = await TestModuleSingleton.callEndpoint()
        .post('/client/create')
        .send({
          ...createClientMockData,
          admin: createAdminMockData,
        })
        .expect(201);

      const userTokenCookie = response.headers['set-cookie'][0];
      const userTokenFromCookie = userTokenCookie
        .split('user_token=')[1]
        .split(';')[0];

      expect(response.headers['set-cookie']).toBeDefined();

      const decodedUserToken: AdminWithClientDto =
        jwtService.decode(userTokenFromCookie);

      expect(decodedUserToken.id).toBeDefined();
      expect(decodedUserToken.email).toMatch(createAdminMockData.email);
      expect(decodedUserToken.client.name).toMatch(createClientMockData.name);
    });
  });
});
