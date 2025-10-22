import { QueueController } from './queue.controller';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { AdminResponseDto, CreatedAdminDto } from 'src/admin/admin.dto';
import { AdminRole, QueueType } from '@prisma/client';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQueueDto, QueueDto } from './queue.dto';
import { AuthService } from 'src/auth/auth.service';

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

const CREATE_QUEUE_MOCK_DATA: Array<
  Omit<CreateQueueDto, 'clientId' | 'unityId'>
> = [
  {
    name: 'Queue General 1',
    type: QueueType.GENERAL,
  },
  {
    name: 'Queue General 2',
    type: QueueType.GENERAL,
  },
  {
    name: 'Queue Appointment 1',
    type: QueueType.APPOINTMENT,
  },
];

describe('QueueController', () => {
  let queueController: QueueController;
  let authService: AuthService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let queueAdminUser: AdminResponseDto;
  let clientAdminUser: AdminResponseDto;
  let unity: UnityDto;
  const queues: QueueDto[] = [];

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueController = module.get<QueueController>(QueueController);
    prismaService = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);

    await TestModuleSingleton.cleanUpDatabase();

    const clientResponse = await prismaService.client.create({
      data: CLIENT_MOCK_DATA,
    });

    client = {
      ...clientResponse,
      address: undefined,
      phone: undefined,
      ownerId: undefined,
    };

    queueAdminUser = await prismaService.admin.create({
      data: {
        ...CREATE_ADMIN_MOCK_DATA[0],
        clientId: client.id,
      },
    });

    clientAdminUser = await prismaService.admin.create({
      data: {
        ...CREATE_ADMIN_MOCK_DATA[1],
        clientId: client.id,
      },
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

    for (let i = 0; i < 2; i++) {
      const createQueueResponse = await prismaService.queue.create({
        data: {
          ...CREATE_QUEUE_MOCK_DATA[i],
          clientId: client.id,
          unityId: unity.id,
        },
      });

      // Format response to QueueDto
      queues.push({
        ...createQueueResponse,
        name: createQueueResponse.name ?? undefined,
        minWaitingTimeInMinutes: undefined,
        maxWaitingTimeInMinutes: undefined,
        currentWaitingTimeInMinutes: undefined,
        adminId: undefined,
      });
    }
  });

  it('should be defined', () => {
    expect(queueController).toBeDefined();
  });

  describe('/queue', () => {
    it('Should throw UnauthorizedException if user is not signed in', async () => {
      const queueIds = queues.map((queue) => queue.id);

      await TestModuleSingleton.callEndpoint()
        .get('/queue')
        .set('Cookie', [`user_token=`])
        .send({
          queueIds: queueIds,
          clientId: client.id,
        })
        .expect(401);
    });

    it('should throw MethodNotAllowedException if the connected admin does NOT has proper Admin Role', async () => {
      const queueIds = queues.map((queue) => queue.id);

      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .get('/queue')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueIds: queueIds,
        })
        .expect(405);
    });

    it('should throw BadRequestException if Queue Ids are missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .get('/queue')
        .set('Cookie', [`user_token=${userToken}`])
        .send([])
        .expect(400);
    });

    it('should return a list of 2 Queue', async () => {
      const queueIds = queues.map((queue) => queue.id);

      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      const queueList = (await TestModuleSingleton.callEndpoint()
        .get('/queue')
        .set('Cookie', [`user_token=${userToken}`])
        .send(queueIds)
        .expect(200)) as { body: QueueDto[] };

      expect(queueList.body.length).toBe(2);
      expect(queueList.body[0].id).toBe(queueIds[0]);
      expect(queueList.body[1].id).toBe(queueIds[1]);
    });
  });

  describe('/queue/create', () => {
    it('Should throw UnauthorizedException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
        })
        .expect(401);
    });

    it('should throw MethodNotAllowedException if the connected admin does NOT has proper Admin Role', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
        })
        .expect(405);
    });

    it('should throw BadRequestException if Queue Type is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
          type: '',
        })
        .expect(400);
    });

    it('should throw BadRequestException if Queue Type Client Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
          clientId: '',
        })
        .expect(400);
    });

    it('should throw BadRequestException if Queue Unity Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
          unityId: '',
        })
        .expect(400);
    });

    it('should throw BadRequestException if Queue Type Unity Id does not exist', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
        })
        .expect(400);
    });

    it('should create a new Queue ', async () => {
      const userToken = await authService.generateJwtForUser({
        ...clientAdminUser,
        client: client,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          ...CREATE_QUEUE_MOCK_DATA[2],
          unityId: unity.id,
        })
        .expect(201);
    });
  });
});
