import { QueuedUserController } from './queued-user.controller';
import { CreateQueueDto, QueueDto } from 'src/queue/queue.dto';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import { CreateUserDto, UserDto } from 'src/user/user.dto';
import { AdminRole, QueuedUserStatus, QueueType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import normalizeNullIntoUndefined from 'src/utils/normalize-null';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { AuthService } from 'src/auth/auth.service';
import {
  AdminDto,
  AdminWithClientDto,
  CreatedAdminDto,
} from 'src/admin/admin.dto';

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
    name: 'Queue General 1',
    type: QueueType.GENERAL,
    startQueueAt: '18:00',
    endQueueAt: '23:00',
  },
  {
    name: 'Queue General 2',
    type: QueueType.GENERAL,
  },
];

const CREATE_QUEUE_USER_MOCK_DATA: CreateUserDto[] = [
  {
    name: 'John Doe',
    email: 'john_doe@example.com',
    passwordHash: 'password_hash',
  },
  {
    name: 'Sarah Smith',
    email: 'sarah_smith@example.com',
    passwordHash: 'password_hash',
  },
];

const CREATE_QUEUE_ADMIN_MOCK_DATA: Omit<CreatedAdminDto, 'clientId'> = {
  name: 'Owner Admin A',
  email: 'owner_admin_a@email.com',
  passwordHash: 'hashed_password',
  role: AdminRole.QUEUE_ADMIN,
};

describe('QueuedUserController', () => {
  let queuedUserController: QueuedUserController;
  let authService: AuthService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;
  const queues: QueueDto[] = [];
  let queueAdmin: AdminWithClientDto;
  const users: UserDto[] = [];

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queuedUserController =
      module.get<QueuedUserController>(QueuedUserController);
    authService = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);

    await TestModuleSingleton.cleanUpDatabase();

    const createClientResponse = await prismaService.client.create({
      data: CREATE_CLIENT_MOCK_DATA,
    });

    client = normalizeNullIntoUndefined(createClientResponse);

    const createUnityResponse = await prismaService.unity.create({
      data: {
        ...CREATE_UNITY_MOCK_DATA,
        clientId: client.id,
      },
    });

    unity = normalizeNullIntoUndefined(createUnityResponse);

    for (const queueData of CREATE_QUEUE_MOCK_DATA) {
      const createQueueResponse = await prismaService.queue.create({
        data: {
          ...queueData,
          clientId: client.id,
          unityId: unity.id,
        },
      });

      queues.push(normalizeNullIntoUndefined(createQueueResponse));
    }

    const adminResponse = await prismaService.admin.create({
      data: {
        ...CREATE_QUEUE_ADMIN_MOCK_DATA,
        clientId: client.id,
        queueIds: [queues[0].id],
      },
    });

    const parsedAdminResponse =
      normalizeNullIntoUndefined<AdminDto>(adminResponse);

    queueAdmin = {
      ...parsedAdminResponse,
      client: client,
    };

    for (const userData of CREATE_QUEUE_USER_MOCK_DATA) {
      const createUserResponse = await prismaService.user.create({
        data: userData,
      });

      users.push(normalizeNullIntoUndefined(createUserResponse));
    }
  });

  beforeEach(async () => {
    await prismaService.queuedUser.deleteMany();
  });

  afterAll(async () => {
    await TestModuleSingleton.endClient();
  });

  it('should be defined', () => {
    expect(queuedUserController).toBeDefined();
  });

  describe('createQueuedUserEntry', () => {
    it('should throw UnauthorizedException if user is not signed in', async () => {
      const queue = queues[0];
      const numberOfSeats = 2;

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await TestModuleSingleton.callEndpoint()
        .post('/queued-user/create')
        .set('Cookie', [`user_token=`])
        .send({
          queueId: queue.id,
          numberOfSeats,
        })
        .expect(401);
    });

    it('should throw BadRequestException no queueId is provided', async () => {
      const userToken = await authService.generateJwtForUser({
        ...users[0],
      });

      const numberOfSeats = 2;

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await TestModuleSingleton.callEndpoint()
        .post('/queued-user/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: '',
          numberOfSeats,
        })
        .expect(400);
    });

    it('should throw BadRequestException number of seats is provided', async () => {
      const userToken = await authService.generateJwtForUser({
        ...users[0],
      });

      const queue = queues[0];

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await TestModuleSingleton.callEndpoint()
        .post('/queued-user/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: queue.id,
          numberOfSeats: '',
        })
        .expect(400);
    });

    it('should throw BadRequestException invalid queueId is provided', async () => {
      const userToken = await authService.generateJwtForUser({
        ...users[0],
      });

      const invalidQueueId = 'invalid-queue-id';

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await TestModuleSingleton.callEndpoint()
        .post('/queued-user/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: invalidQueueId,
          numberOfSeats: '',
        })
        .expect(400);
    });

    it('should throw BadRequestException invalid number of seats is provided', async () => {
      const userToken = await authService.generateJwtForUser({
        ...users[0],
      });

      const queue = queues[0];
      const numberOfSeats = 0;

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await TestModuleSingleton.callEndpoint()
        .post('/queued-user/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: queue.id,
          numberOfSeats,
        })
        .expect(400);
    });

    it('should return 201 Created', async () => {
      const userToken = await authService.generateJwtForUser({
        ...users[0],
      });

      const queue = queues[0];
      const numberOfSeats = 2;

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await TestModuleSingleton.callEndpoint()
        .post('/queued-user/create')
        .set('Cookie', [`user_token=${userToken}`])
        .send({
          queueId: queue.id,
          numberOfSeats,
        })
        .expect(201);
    });
  });

  describe('serveQueuedUserEntry', () => {
    it('should throw UnauthorizedException if user is not signed in', async () => {
      const queuedUserId = 'some-queued-user-id';
      const queueId = 'some-queue-id';

      await TestModuleSingleton.callEndpoint()
        .patch('/queued-user/serve')
        .set('Cookie', [`user_token=`])
        .send({ queueId, queuedUserId })
        .expect(401);
    });

    it('should throw ForbiddenException if signed user is not an Admin', async () => {
      const adminUserToken = await authService.generateJwtForUser({
        ...users[0],
      });

      const queuedUserId = 'some-queued-user-id';
      const queueId = 'some-queue-id';

      await TestModuleSingleton.callEndpoint()
        .patch('/queued-user/serve')
        .set('Cookie', [`user_token=${adminUserToken}`])
        .send({ queueId, queuedUserId })
        .expect(403);
    });

    it('should throw BadRequestException no queueId is provided', async () => {
      const adminUserToken = await authService.generateJwtForUser(queueAdmin);

      const invalidQueueId = 'some-queue-id';
      const queuedUserId = 'some-queued-user-id';

      await TestModuleSingleton.callEndpoint()
        .patch('/queued-user/serve')
        .set('Cookie', [`user_token=${adminUserToken}`])
        .send({ invalidQueueId, queuedUserId })
        .expect(400);
    });

    it('should throw BadRequestException no queuedUserId is provided', async () => {
      const adminUserToken = await authService.generateJwtForUser(queueAdmin);

      const queueId = 'some-queue-id';
      const invalidQueuedUserId = '';

      await TestModuleSingleton.callEndpoint()
        .patch('/queued-user/serve')
        .set('Cookie', [`user_token=${adminUserToken}`])
        .send({ queueId, invalidQueuedUserId })
        .expect(400);
    });

    it('should throw NotFoundException if ids does not belong to any entry', async () => {
      const adminUserToken = await authService.generateJwtForUser(queueAdmin);

      const queuedUserId = 'some-queued-user-id';
      const queueId = 'some-queue-id';

      await TestModuleSingleton.callEndpoint()
        .patch('/queued-user/serve/')
        .set('Cookie', [`user_token=${adminUserToken}`])
        .send({ queueId, queuedUserId })
        .expect(404);
    });

    it('should return 200 if serve a WAITING status queuedUser entry is successful', async () => {
      const userId = users[0].id;

      const queueId = queues[0].id;
      const numberOfSeats = 2;

      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserResponse = await prismaService.queuedUser.create({
        data: {
          queueId,
          userId,
          status: QueuedUserStatus.WAITING,
          numberOfSeats,
        },
      });

      expect(queuedUserResponse.id).toBeDefined();

      const adminUserToken = await authService.generateJwtForUser(queueAdmin);

      await TestModuleSingleton.callEndpoint()
        .patch('/queued-user/serve')
        .set('Cookie', [`user_token=${adminUserToken}`])
        .send({ queueId, queuedUserId: queuedUserResponse?.id })
        .expect(200);
    });
  });
});
