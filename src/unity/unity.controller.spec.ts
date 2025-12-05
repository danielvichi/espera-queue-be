import { UnityController } from './unity.controller';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { CreateUnityDto, UnityDto } from './unity.dto';
import { AuthService } from 'src/auth/auth.service';
import { AdminRole } from '@prisma/client';
import { AdminResponseDto, CreatedAdminDto } from 'src/admin/admin.dto';
import { AdminService } from 'src/admin/admin.service';
import { ClientService } from 'src/client/client.service';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { PrismaService } from 'src/prisma/prisma.service';

const UNITY_MOCK_DATA: Array<Omit<CreateUnityDto, 'clientId'>> = [
  {
    name: 'Unity Controller A',
  },
  {
    name: 'Unity Controller B',
  },
];

const CLIENT_MOCK_DATA: CreateClientDto = {
  name: 'Client mock name',
};

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
    role: AdminRole.CLIENT_ADMIN,
    unityIds: ['1'],
    email: 'admin2@email.com',
  },
];

describe('UnityController', () => {
  let unityController: UnityController;

  let clientService: ClientService;
  let authService: AuthService;
  let adminService: AdminService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let queueAdminUser: AdminResponseDto;
  let clientAdminUser: AdminResponseDto;
  let unity: UnityDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    unityController = module.get<UnityController>(UnityController);

    prismaService = module.get<PrismaService>(PrismaService);
    clientService = module.get<ClientService>(ClientService);
    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);

    await TestModuleSingleton.cleanUpDatabase();

    client = await clientService.createClient(CLIENT_MOCK_DATA);

    queueAdminUser = await adminService.createAdmin({
      ...CREATE_ADMIN_MOCK_DATA[0],
      clientId: client.id,
    });

    clientAdminUser = await adminService.createAdmin({
      ...CREATE_ADMIN_MOCK_DATA[1],
      clientId: client.id,
    });

    const createUnityResponse = await prismaService.unity.create({
      data: {
        ...UNITY_MOCK_DATA[1],
        clientId: client.id,
      },
    });

    unity = {
      ...createUnityResponse,
      address: createUnityResponse.address ?? undefined,
      email: createUnityResponse.email ?? undefined,
      phone: createUnityResponse.phone ?? undefined,
    };
  });

  it('should be defined', () => {
    expect(unityController).toBeDefined();
  });

  describe('/unity/create', () => {
    it('should throw a UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/unity/create')
        .set('Cookie', [`user_token=`])
        .send({
          name: UNITY_MOCK_DATA[0].name,
        })
        .expect(401);
    });

    it('should throw a BadRequestException if Unity Name is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/unity/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          name: '',
        })
        .expect(400);
    });

    it('should throw a BadRequestException if Unity ClientId is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/unity/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          name: UNITY_MOCK_DATA[0].name,
          clientId: '',
        })
        .expect(400);
    });
  });

  it('should throw MethodNotAllowedException if the connected admin does NOT has proper Admin Role', async () => {
    const userToken = await authService.generateJwtForUser({
      ...queueAdminUser,
      client: client,
    });

    await TestModuleSingleton.callEndpoint()
      .post('/unity/create')
      .set('Cookie', [`user_token=${userToken}`])
      .send({
        name: UNITY_MOCK_DATA[0].name,
        clientId: client.id,
      })
      .expect(405);
  });

  it('should create a Unity with proper connected admin role and proper payload', async () => {
    const userToken = await authService.generateJwtForUser({
      ...clientAdminUser,
      client: client,
    });

    await TestModuleSingleton.callEndpoint()
      .post('/unity/create')
      .set('Cookie', [`user_token=${userToken}`])
      .send({
        name: UNITY_MOCK_DATA[0].name,
        clientId: client.id,
      })
      .expect(201);
  });

  describe('/unity/disable', () => {
    it('should throw a UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .patch('/unity/disable')
        .set('Cookie', [`user_token=`])
        .send({
          unityId: '',
          payload: {},
        })
        .expect(401);
    });

    it('should throw a UnauthorizedException if the connected admin does NOT has proper Admin Role', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/disable')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: '',
        })
        .expect(405);
    });

    it('should throw a BadRequestException if Unity Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/disable')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: '',
        })
        .expect(400);
    });

    it('should disable the Unity Id', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      const enabledUnity = await prismaService.unity.findFirst({
        where: {
          enabled: true,
        },
      });

      if (!enabledUnity || !enabledUnity.id) {
        throw new Error('No enabled Unity was founded');
      }

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/disable')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: enabledUnity?.id,
        })
        .expect(200);
    });
  });

  describe('/unity/enable', () => {
    it('should throw a UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .patch('/unity/enable')
        .set('Cookie', [`user_token=`])
        .send({
          unityId: '',
          payload: {},
        })
        .expect(401);
    });

    it('should throw a UnauthorizedException if the connected admin does NOT has proper Admin Role', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/enable')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: '',
        })
        .expect(405);
    });

    it('should throw a BadRequestException if Unity Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/enable')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: '',
        })
        .expect(400);
    });

    it('should enable a disabled the Unity Id', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      const enabledUnity = await prismaService.unity.findFirst({
        where: {
          enabled: false,
        },
      });

      if (!enabledUnity || !enabledUnity.id) {
        throw new Error('No disabled Unity was founded');
      }

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/enable')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: enabledUnity?.id,
        })
        .expect(200);
    });
  });

  describe('/unity/enable', () => {
    it('should throw a UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .patch('/unity/update')
        .set('Cookie', [`user_token=`])
        .send({
          unityId: '',
          payload: {
            address: 'some_address',
          },
        })
        .expect(401);
    });

    it('should throw a UnauthorizedException if the connected admin does NOT has proper Admin Role', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/update')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: '',
          payload: {
            address: 'some_address',
          },
        })
        .expect(405);
    });

    it('should throw a BadRequestException if Unity Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .patch('/unity/update')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: '',
          payload: {
            address: 'some_address',
          },
        })
        .expect(400);
    });

    it('should update a Unity data', async () => {
      const newAddress = 'New Address for Controller';

      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      const existingUnity = await prismaService.unity.findFirst({
        where: {
          enabled: true,
        },
      });

      if (!existingUnity || !existingUnity.id) {
        throw new Error('No disabled Unity was founded');
      }

      const updatedUnity = await TestModuleSingleton.callEndpoint()
        .patch('/unity/update')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unityId: existingUnity.id,
          payload: {
            address: newAddress,
          },
        })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(updatedUnity.body.address).toBe(newAddress);
    });
  });

  describe('/unity/all', () => {
    it('should throw a UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .get('/unity/all')
        .set('Cookie', [`user_token=`])
        .send()
        .expect(401);
    });

    it('should throw a UnauthorizedException if the connected admin does NOT has proper Admin Role', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .get('/unity/all')
        .set('Cookie', [`user_token=${userToken}`])
        .send()
        .expect(405);
    });

    it('should return a list of Unity for the connected user', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      const response = await TestModuleSingleton.callEndpoint()
        .get('/unity/all')
        .set('Cookie', [`user_token=${userToken}`])
        .send()
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.length).toBe(2);
    });
  });

  describe('/unity', () => {
    it('should throw a UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .get('/unity')
        .set('Cookie', [`user_token=`])
        .send({
          unitiesIds: [unity.id],
        })
        .expect(401);
    });

    it('should throw a UnauthorizedException if the connected admin does NOT has proper Admin Role', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .get('/unity')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unitiesIds: [unity.id],
        })
        .expect(405);
    });

    it('should return a list of Unities', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      const unityResponse = await TestModuleSingleton.callEndpoint()
        .get('/unity')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          unitiesIds: [unity.id],
        })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(unityResponse.body.length).toBe(1);
    });
  });
});
