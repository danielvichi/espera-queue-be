import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import { CreateQueueDto, QueueDto } from 'src/queue/queue.dto';
import { QueueType } from '@prisma/client';
import { QueueUserDto } from 'src/queue-user/queue-user.dto';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueueInstanceController } from './queue-instance.controller';
import { AuthService } from 'src/auth/auth.service';

const CREATE_CLIENT_MOCK_DATA: CreateClientDto = {
  name: 'Client Test',
};

const CREATE_UNITY_MOCK_DATA: Omit<CreateUnityDto, 'clientId'> = {
  name: 'Unity Name',
  address: 'some address',
};

const CREATE_QUEUE_MOCK_DATA: Array<
  Omit<CreateQueueDto, 'clientId' | 'unityId'>
> = [
  {
    name: 'Queue General',
    type: QueueType.GENERAL,
  },
  {
    name: 'Queue Priority',
    type: QueueType.PRIORITY,
  },
];

const CREATE_QUEUE_USER_MOCK_DATA = {
  name: 'User Test',
  email: 'testuser@example.com',
  passwordHash: 'hashed-password',
};

describe('QueueInstanceController', () => {
  let queueInstanceController: QueueInstanceController;
  let authService: AuthService;
  let prismaService: PrismaService;
  let client: CreateClientResponseDto;
  let unity: UnityDto;
  let queueGeneral: QueueDto;
  let queueUser: QueueUserDto;
  let queueInstanceId: string;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueInstanceController = module.get<QueueInstanceController>(
      QueueInstanceController,
    );
    prismaService = module.get<PrismaService>(PrismaService);
    authService = module.get<AuthService>(AuthService);
  });

  beforeEach(async () => {
    await TestModuleSingleton.cleanUpDatabase();

    const createClientResponse = await prismaService.client.create({
      data: CREATE_CLIENT_MOCK_DATA,
    });

    // Format response to CreateClientResponseDto
    client = {
      ...createClientResponse,
      phone: undefined,
      address: undefined,
      ownerId: undefined,
    };

    const createUnityResponse = await prismaService.unity.create({
      data: {
        ...CREATE_UNITY_MOCK_DATA,
        clientId: client.id,
      },
    });

    // Format response to UnityDto
    unity = {
      ...createUnityResponse,
      address: createUnityResponse.address ?? undefined,
      email: undefined,
      phone: undefined,
    };

    queueGeneral = await prismaService.queue.create({
      data: {
        ...CREATE_QUEUE_MOCK_DATA[0],
        clientId: client.id,
        unityId: unity.id,
      },
    });

    const queueInstanceResponse = await prismaService.queueInstance.create({
      data: {
        date: new Date(),
        queueId: queueGeneral.id,
      },
    });

    queueInstanceId = queueInstanceResponse.id;

    queueUser = await prismaService.queueUser.create({
      data: CREATE_QUEUE_USER_MOCK_DATA,
    });
  });

  it('should be defined', () => {
    expect(queueInstanceController).toBeDefined();
  });

  describe('/queue-instance/add-user', () => {
    it('should throw UserNotFoundException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=`])
        .send({
          queueInstanceId: queueInstanceId,
        })
        .expect(401);
    });

    it('should throw BadRequestException if Queue Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: '',
        })
        .expect(400);
    });

    it('should add User to Queue Instance and return true', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      const response = (await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: queueInstanceId,
        })
        .expect(201)) as { body: { success: boolean } };

      expect(response.body.success).toBe(true);
    });

    it('should throw ConflictException if user is already in the same Queue', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: queueInstanceId,
        })
        .expect(201);

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: queueInstanceId,
        })
        .expect(409);
    });
  });
});
