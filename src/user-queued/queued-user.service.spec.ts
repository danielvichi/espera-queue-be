import { CreateUserDto, UserDto } from 'src/user/user.dto';
import { QueuedUserService } from './queued-user.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { CreateQueueDto, QueueDto } from 'src/queue/queue.dto';
import { QueuedUserStatus, QueueType } from '@prisma/client';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  defaultQueueUserExceptionsMessage,
  QueuedUserBadRequestException,
  QueuedUserConflictException,
} from './queued-user-exceptions';
import normalizeNullIntoUndefined from 'src/utils/normalize-null';

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

describe('QueuedUserService', () => {
  let queuedUSerServiceservice: QueuedUserService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;
  const queues: QueueDto[] = [];
  const users: UserDto[] = [];

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queuedUSerServiceservice = module.get<QueuedUserService>(QueuedUserService);
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
    expect(queuedUSerServiceservice).toBeDefined();
  });

  describe('createQueuedUserEntry', () => {
    it('should throw an error if queue Id is not provided', async () => {
      const userId = users[0].id;

      await expect(
        queuedUSerServiceservice.createQueuedUserEntry('', userId, 1),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
        ),
      );
    });

    it('should throw an error if user Id is not provided', async () => {
      const queueId = queues[0].id;

      await expect(
        queuedUSerServiceservice.createQueuedUserEntry(queueId, '', 1),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.USER_ID_REQUIRED,
        ),
      );
    });

    it('should throw an error if number of seats is not valid', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      await expect(
        queuedUSerServiceservice.createQueuedUserEntry(queueId, userId, -1),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.VALID_NUMBER_OF_SEATS_REQUIRED,
        ),
      );
    });

    it('should throw an error if is not between Queue working our parameters', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(14);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      await expect(
        queuedUSerServiceservice.createQueuedUserEntry(queueId, userId, 1),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.OUTSIDE_QUEUE_WORKING_HOURS,
        ),
      );
    });

    it('should create a queued user entry', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();
      expect(queuedUserEntry.queueId).toBe(queueId);
      expect(queuedUserEntry.userId).toBe(userId);
      expect(queuedUserEntry.numberOfSeats).toBe(1);
      expect(queuedUserEntry.status).toBe('WAITING');
    });

    it('should trow an error if user is already queued for the same Queue with Waiting status', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      await expect(
        queuedUSerServiceservice.createQueuedUserEntry(queueId, userId, 1),
      ).rejects.toThrow(
        new QueuedUserConflictException(
          defaultQueueUserExceptionsMessage.USER_ALREADY_QUEUED,
        ),
      );
    });

    it('should trow an error if user is already queued for a different Queue with Waiting status for the same day', async () => {
      const queueId1 = queues[0].id;
      const queueId2 = queues[1].id;
      const userId = users[0].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId1,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      await expect(
        queuedUSerServiceservice.createQueuedUserEntry(queueId2, userId, 1),
      ).rejects.toThrow(
        new QueuedUserConflictException(
          defaultQueueUserExceptionsMessage.USER_ALREADY_QUEUED,
        ),
      );
    });

    it('should allow re-queuing if previous queued entry was on a different day', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      // Manually update the createdAt date to be yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prismaService.queuedUser.update({
        where: { id: queuedUserEntry.id },
        data: { createdAt: yesterday },
      });

      // Attempt to create a new queued entry
      const newQueuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(newQueuedUserEntry).toBeDefined();
      expect(newQueuedUserEntry.id).not.toBe(queuedUserEntry.id);
    });

    it('should allow re-queuing if previous queued entry status is not WAITING', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      // Manually update the status to SERVED
      await prismaService.queuedUser.update({
        where: { id: queuedUserEntry.id },
        data: { status: QueuedUserStatus.SERVICED },
      });

      // Attempt to create a new queued entry
      const newQueuedUserEntry =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(newQueuedUserEntry).toBeDefined();
      expect(newQueuedUserEntry.id).not.toBe(queuedUserEntry.id);
    });

    it('should allow different users to queue for the same Queue', async () => {
      const queueId = queues[0].id;
      const userId1 = users[0].id;
      const userId2 = users[1].id;

      // Mock current time to be outside working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry1 =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId1,
          1,
        );

      expect(queuedUserEntry1).toBeDefined();

      const queuedUserEntry2 =
        await queuedUSerServiceservice.createQueuedUserEntry(
          queueId,
          userId2,
          1,
        );

      expect(queuedUserEntry2).toBeDefined();
      expect(queuedUserEntry2.id).not.toBe(queuedUserEntry1.id);
    });
  });
});
