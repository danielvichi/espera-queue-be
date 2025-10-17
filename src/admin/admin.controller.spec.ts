import { AdminController } from './admin.controller';
import { AuthService } from 'src/auth/auth.service';
import { AdminService } from './admin.service';
import { AdminResponseDto, CreatedAdminDto } from './admin.dto';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AdminRole } from '@prisma/client';
import { InputClientDto, InputResponseClientDto } from 'src/client/client.dto';
import { ClientService } from 'src/client/client.service';

const CREATE_ADMIN_MOCK_DATA: Array<Omit<CreatedAdminDto, 'clientId'>> = [
  {
    name: 'Admin Name',
    passwordHash: 'password_hash',
    role: AdminRole.QUEUE_ADMIN,
    queueIds: ['1'],
    email: 'admin@email.com',
  },
  {
    name: 'Admin Name 2',
    passwordHash: 'password_hash',
    role: AdminRole.UNITY_ADMIN,
    unityIds: ['1'],
    email: 'admin2@email.com',
  },
];

const CLIENT_MOCK_DATA: InputClientDto = {
  name: 'Client mock name',
};

describe('AdminController', () => {
  let adminController: AdminController;
  let authService: AuthService;
  let adminService: AdminService;
  let clientService: ClientService;

  let adminUser: AdminResponseDto;
  let client: InputResponseClientDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    adminController = module.get<AdminController>(AdminController);
    authService = module.get<AuthService>(AuthService);
    clientService = module.get<ClientService>(ClientService);
    adminService = module.get<AdminService>(AdminService);

    await TestModuleSingleton.cleanUpDatabase();

    client = await clientService.createClient(CLIENT_MOCK_DATA);

    adminUser = await adminService.createAdmin({
      ...CREATE_ADMIN_MOCK_DATA[0],
      clientId: client.id,
    });
  });

  it('should be defined', () => {
    expect(adminController).toBeDefined();
  });

  describe('/admin/create', () => {
    it('should throw UnauthorizedException for not authenticated sessions on creating new admin', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/admin/create')
        .send(CREATE_ADMIN_MOCK_DATA)
        .expect(401);
    });

    it('should throw BadRequestException for missing email data on creating new admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, ...createAdminMockDataWithoutEmail } =
        CREATE_ADMIN_MOCK_DATA[1];
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/admin/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...createAdminMockDataWithoutEmail,
          email: '',
        })
        .expect(400);
    });

    it('should throw BadRequestException for missing any relation Id on creating new admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { unityIds, ...createAdminMockDataWithoutAnyId } =
        CREATE_ADMIN_MOCK_DATA[1];
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/admin/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...createAdminMockDataWithoutAnyId,
          unityIds: [],
        })
        .expect(400);
    });

    it('should throw BadRequestException for passing queueId for Unity Admin Role on creating new admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { unityIds, ...createAdminMockDataWithoutAnyId } =
        CREATE_ADMIN_MOCK_DATA[1];
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/admin/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...createAdminMockDataWithoutAnyId, // Admin.Role === Unity
          queueIds: [1],
        })
        .expect(400);
    });

    it('should throw BadRequestException for passing unityId for Queue Admin Role on creating new admin', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { role, ...createAdminMockDataWithoutRole } =
        CREATE_ADMIN_MOCK_DATA[1];
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/admin/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...createAdminMockDataWithoutRole, // unityIds: ['1'],
          role: AdminRole.QUEUE_ADMIN,
        })
        .expect(400);
    });

    it('should create new admin', async () => {
      const completeData = CREATE_ADMIN_MOCK_DATA[1];

      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/admin/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send(completeData)
        .expect(201);
    });
  });

  describe('/admin/profile', () => {
    it('should throw UnauthorizedException for not authenticated sessions to get profile data', async () => {
      await TestModuleSingleton.callEndpoint()
        .get('/admin/profile')
        .set('Cookie', [`user_token=`])
        .expect(401);
    });

    it('should get profile data for authenticated sessions', async () => {
      const userToken = await authService.generateJwtForUser({
        ...adminUser,
        client: client,
      });

      const profileResponse = await TestModuleSingleton.callEndpoint()
        .get('/admin/profile')
        .set('Cookie', [`user_token=${userToken}`])
        .expect(200);

      const userDataFromResponse = profileResponse.body as AdminResponseDto;

      expect(userDataFromResponse).toBeDefined();
      expect(userDataFromResponse['id']).toBe(adminUser.id);
    });
  });
});
