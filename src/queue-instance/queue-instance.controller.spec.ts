import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import { CreateQueueDto, QueueDto } from 'src/queue/queue.dto';
import { AdminRole, QueueType } from '@prisma/client';
import { QueueUserDto } from 'src/queue-user/queue-user.dto';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueueInstanceController } from './queue-instance.controller';
import { AuthService } from 'src/auth/auth.service';
import { AdminDto } from 'src/admin/admin.dto';

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

const CREATE_ADMIN_MOCK_DATA = {
  name: 'Amin Test',
  role: AdminRole.UNITY_ADMIN,
  email: 'testadmin@example.com',
  passwordHash: 'hashed-password',
};

describe('QueueInstanceController', () => {
  let queueInstanceController: QueueInstanceController;
  let authService: AuthService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let admin: AdminDto;
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

    admin = await prismaService.admin.create({
      data: {
        ...CREATE_ADMIN_MOCK_DATA,
        clientId: client.id,
        unityIds: [unity.id],
      },
    });

    queueGeneral = await prismaService.queue.create({
      data: {
        ...CREATE_QUEUE_MOCK_DATA[0],
        clientId: client.id,
        unityId: unity.id,
      },
    });

    const queueInstanceResponse = await prismaService.queueInstance.create({
      data: {
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
          queueId: queueGeneral.id,
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
          queueId: '',
        })
        .expect(400);
    });

    it('should create queue Instance and add User to Queue Instance and return true', async () => {
      // Creating fresh new Queue without Queue instance
      const queueResponse = await prismaService.queue.create({
        data: {
          ...CREATE_QUEUE_MOCK_DATA[1],
          clientId: client.id,
          unityId: unity.id,
        },
      });

      // Making sure there's no queue instance
      const queueInstanceResponse = await prismaService.queueInstance.findMany({
        where: {
          queueId: queueResponse.id,
        },
      });

      expect(queueInstanceResponse.length).toBe(0);

      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      const response = (await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: queueGeneral.id,
        })
        .expect(201)) as { body: { success: boolean } };

      expect(response.body.success).toBe(true);
    });

    it('should add User to an existing Queue Instance and return true', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      const response = (await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: queueGeneral.id,
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
          queueId: queueGeneral.id,
        })
        .expect(201);

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/add-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: queueGeneral.id,
        })
        .expect(409);
    });
  });

  describe('/queue-instance/remove-user', () => {
    it('should throw UserNotFoundException if user is not signed in', async () => {
      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/remove-user')
        .set('Cookie', [`user_token=`])
        .send({
          queueInstanceId: queueInstanceId,
        })
        .expect(401);
    });

    it('should throw BadRequestException if Queue Instance Id is missing', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/remove-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: '',
          userId: queueUser.id,
        })
        .expect(400);
    });

    it('should throw UserNotInQueueException if user is not in the Queue Instance', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/remove-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: queueInstanceId,
          userId: queueUser.id,
        })
        .expect(409);
    });

    it('should throw MethodNotAllowedException if signed User is not Admin and trying to remove a different user of the Authenticated', async () => {
      const userToken = await authService.generateJwtForUser({
        ...queueUser,
      });

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/remove-user')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueInstanceId: queueInstanceId,
          userId: 'different_id',
        })
        .expect(405);
    });

    it('should remove user from the Queue Instance', async () => {
      const adminToken = await authService.generateJwtForUser({
        ...admin,
      });

      const queueInstanceWithUser = await prismaService.queueInstance.update({
        where: {
          id: queueInstanceId,
        },
        data: {
          usersInQueue: [queueUser.id],
        },
      });

      expect(queueInstanceWithUser.usersInQueue.length).toBe(1);
      expect(queueInstanceWithUser.usersInQueue[0]).toBe(queueUser.id);

      await TestModuleSingleton.callEndpoint()
        .post('/queue-instance/remove-user')
        .set('Cookie', [`user_token=${adminToken}`])
        .send({
          queueInstanceId: queueInstanceId,
          userId: queueUser.id,
        })
        .expect(201);
    });

    it('should remove a different userId from authenticated one if signed User is an Admin ', async () => {});
  });
});
