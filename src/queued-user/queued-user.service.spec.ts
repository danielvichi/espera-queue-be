import { CreateUserDto, UserDto } from 'src/user/user.dto';
import { QueuedUserService } from './queued-user.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { CreateQueueDto, QueueDto } from 'src/queue/queue.dto';
import { AdminRole, QueuedUserStatus, QueueType } from '@prisma/client';
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
  QueuedUserNotFoundException,
  QueueNotFoundException,
} from './queued-user-exceptions';
import normalizeNullIntoUndefined from 'src/utils/normalize-null';
import {
  AdminDto,
  AdminWithClientDto,
  CreatedAdminDto,
} from 'src/admin/admin.dto';
import { MethodNotAllowedException } from '@nestjs/common';

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
    startQueueAt: '18:00',
    endQueueAt: '23:00',
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
  {
    name: 'Mike Johnson',
    email: 'mike_johnson@example.com',
    passwordHash: 'password_hash',
  },
  {
    name: 'Karen Davis',
    email: 'kare_davis@example.com',
    passwordHash: 'password_hash',
  },
];

const CREATE_QUEUE_ADMIN_MOCK_DATA: Omit<CreatedAdminDto, 'clientId'> = {
  name: 'Owner Admin A',
  email: 'owner_admin_a@email.com',
  passwordHash: 'hashed_password',
  role: AdminRole.QUEUE_ADMIN,
};

describe('QueuedUserService', () => {
  let queuedUserServiceservice: QueuedUserService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;
  const queues: QueueDto[] = [];
  let queueAdmin: AdminWithClientDto;
  const users: UserDto[] = [];

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queuedUserServiceservice = module.get<QueuedUserService>(QueuedUserService);
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
    expect(queuedUserServiceservice).toBeDefined();
  });

  describe('createQueuedUserEntry', () => {
    it('should throw an error if queue Id is not provided', async () => {
      const userId = users[0].id;

      await expect(
        queuedUserServiceservice.createQueuedUserEntry('', userId, 1),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
        ),
      );
    });

    it('should throw an error if user Id is not provided', async () => {
      const queueId = queues[0].id;

      await expect(
        queuedUserServiceservice.createQueuedUserEntry(queueId, '', 1),
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
        queuedUserServiceservice.createQueuedUserEntry(queueId, userId, -1),
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
        queuedUserServiceservice.createQueuedUserEntry(queueId, userId, 1),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.OUTSIDE_QUEUE_WORKING_HOURS,
        ),
      );
    });

    it('should create a queued user entry', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
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

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      await expect(
        queuedUserServiceservice.createQueuedUserEntry(queueId, userId, 1),
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

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId1,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      await expect(
        queuedUserServiceservice.createQueuedUserEntry(queueId2, userId, 1),
      ).rejects.toThrow(
        new QueuedUserConflictException(
          defaultQueueUserExceptionsMessage.USER_ALREADY_QUEUED,
        ),
      );
    });

    it('should allow re-queuing if previous queued entry was on a different day', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
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
        await queuedUserServiceservice.createQueuedUserEntry(
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

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
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
        await queuedUserServiceservice.createQueuedUserEntry(
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

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry1 =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId1,
          1,
        );

      expect(queuedUserEntry1).toBeDefined();

      const queuedUserEntry2 =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId2,
          1,
        );

      expect(queuedUserEntry2).toBeDefined();
      expect(queuedUserEntry2.id).not.toBe(queuedUserEntry1.id);
    });
  });

  describe('getQueuedUserForQueue', () => {
    it('should throw an error if queue Id is not provided', async () => {
      const userId = users[0].id;

      await expect(
        queuedUserServiceservice.getQueuedUserForQueue('', userId),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
        ),
      );
    });

    it('should throw an error if user Id is not provided', async () => {
      const queueId = queues[0].id;

      await expect(
        queuedUserServiceservice.getQueuedUserForQueue(queueId, ''),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.USER_ID_REQUIRED,
        ),
      );
    });

    it('should return the queued user entry for the given queue and user', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      const fetchedQueuedUserEntry =
        await queuedUserServiceservice.getQueuedUserForQueue(queueId, userId);

      expect(fetchedQueuedUserEntry).toBeDefined();
      expect(fetchedQueuedUserEntry?.id).toBe(queuedUserEntry.id);
    });

    it('should return null if no queued user entry exists for the given queue and user', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      const fetchedQueuedUserEntry =
        await queuedUserServiceservice.getQueuedUserForQueue(queueId, userId);

      expect(fetchedQueuedUserEntry).toBeNull();
    });

    it('should return null if queued user entry exists for a different queue', async () => {
      const queueId1 = queues[0].id;
      const queueId2 = queues[1].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId1,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      const fetchedQueuedUserEntry =
        await queuedUserServiceservice.getQueuedUserForQueue(queueId2, userId);

      expect(fetchedQueuedUserEntry).toBeNull();
    });

    it('should return latest entry if multiple queued user entries exist for the same queue and user', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const firstQueuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(firstQueuedUserEntry).toBeDefined();

      // Manually update the createdAt date to be yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prismaService.queuedUser.update({
        where: { id: firstQueuedUserEntry.id },
        data: { createdAt: yesterday },
      });

      const secondQueuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          2,
        );

      expect(secondQueuedUserEntry).toBeDefined();

      const fetchedQueuedUserEntry =
        await queuedUserServiceservice.getQueuedUserForQueue(queueId, userId);

      expect(fetchedQueuedUserEntry).toBeDefined();
      expect(fetchedQueuedUserEntry?.id).toBe(secondQueuedUserEntry.id);
    });
  });

  describe('serveQueuedUser', () => {
    it('should throw an error if queue Id is not provided', async () => {
      const userId = users[0].id;

      await expect(
        queuedUserServiceservice.serveQueuedUser('', userId),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
        ),
      );
    });

    it('should throw an error if Queued User Id is not provided', async () => {
      const queueId = queues[0].id;

      await expect(
        queuedUserServiceservice.serveQueuedUser(queueId, ''),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUED_USER_ID_REQUIRED,
        ),
      );
    });

    it('should throw an error if no queued user entry exists for the given queue and user', async () => {
      const queueId = queues[0].id;
      const invalidQueuedUserId = 'invalid-queued-user-entry-id';

      await expect(
        queuedUserServiceservice.serveQueuedUser(queueId, invalidQueuedUserId),
      ).rejects.toThrow(new QueuedUserNotFoundException(invalidQueuedUserId));
    });

    it('should throw an error if the user does not exist', async () => {
      const queueId = queues[0].id;
      const invalidUserId = 'non-existent-user-id';

      await expect(
        queuedUserServiceservice.serveQueuedUser(queueId, invalidUserId),
      ).rejects.toThrow(new QueuedUserNotFoundException(invalidUserId));
    });

    it('should throw an error if the queue does not exist', async () => {
      const invalidQueueId = 'non-existent-queue-id';
      const userId = users[0].id;

      await expect(
        queuedUserServiceservice.serveQueuedUser(invalidQueueId, userId),
      ).rejects.toThrow(new QueueNotFoundException(invalidQueueId));
    });

    it('should throw an error if the queued user entry status is not WAITING', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
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

      await expect(
        queuedUserServiceservice.serveQueuedUser(queueId, queuedUserEntry.id),
      ).rejects.toThrow(
        new QueuedUserConflictException(
          defaultQueueUserExceptionsMessage.USER_CANNOT_BE_SERVED,
        ),
      );
    });

    it('should serve the queued user and update the status to SERVICED', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();
      expect(queuedUserEntry.status).toBe(QueuedUserStatus.WAITING);

      const servedQueuedUserEntry =
        await queuedUserServiceservice.serveQueuedUser(
          queueId,
          queuedUserEntry.id,
        );

      expect(servedQueuedUserEntry).toBeDefined();
      expect(servedQueuedUserEntry.id).toBe(queuedUserEntry.id);
      expect(servedQueuedUserEntry.status).toBe(QueuedUserStatus.SERVICED);
      expect(servedQueuedUserEntry.servedAt).toBeDefined();
    });
  });

  describe('checkIsQueueAdminOrThrow', () => {
    it('should throw BadRequestException if logged user does not have admin role', async () => {
      const queueId = queues[0].id;
      const invalidQueueAdmin = {} as AdminWithClientDto;

      await expect(
        queuedUserServiceservice.checkIsQueueAdminOrThrow(
          invalidQueueAdmin,
          queueId,
        ),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.USER_ROLE_REQUIRED,
        ),
      );
    });

    it('should throw BadRequestException if queue Id is not provided', async () => {
      const invalidQueueId = '';

      await expect(
        queuedUserServiceservice.checkIsQueueAdminOrThrow(
          queueAdmin,
          invalidQueueId,
        ),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
        ),
      );
    });

    it('should throw MethodNotAllowedException if provided user does not have admin privileges', async () => {
      const queueId = queues[0].id;
      const wrongClientIdAdmin = {
        ...queueAdmin,
        clientId: 'wrong_client_id',
      };

      await expect(
        queuedUserServiceservice.checkIsQueueAdminOrThrow(
          wrongClientIdAdmin,
          queueId,
        ),
      ).rejects.toThrow(
        new MethodNotAllowedException(
          defaultQueueUserExceptionsMessage.CLIENT_ADMIN_PRIVILEGE_REQUIRED,
        ),
      );
    });

    it('should throw MethodNotAllowedException if is Queue Admin for a different Queue', async () => {
      const wrongQueueId = queues[1].id;

      await expect(
        queuedUserServiceservice.checkIsQueueAdminOrThrow(
          queueAdmin,
          wrongQueueId,
        ),
      ).rejects.toThrow(
        new MethodNotAllowedException(
          defaultQueueUserExceptionsMessage.QUEUE_ADMIN_PRIVILEGE_REQUIRED,
        ),
      );
    });

    it('should return null if all requirements is ok', async () => {
      const queueId = queues[0].id;

      const response = await queuedUserServiceservice.checkIsQueueAdminOrThrow(
        queueAdmin,
        queueId,
      );

      expect(response).toBeNull();
    });
  });

  describe('getQueuedUsersForQueueActiveSession', () => {
    it('should throw BadRequestException if queueId is not provided', async () => {
      await expect(
        queuedUserServiceservice.getQueuedUsersForQueueActiveSession(''),
      ).rejects.toThrow(
        new QueuedUserBadRequestException(
          defaultQueueUserExceptionsMessage.QUEUE_ID_REQUIRED,
        ),
      );
    });

    it('should throw NotFoundException if queue does not exist', async () => {
      const invalidQueueId = 'invalid_id';
      await expect(
        queuedUserServiceservice.getQueuedUsersForQueueActiveSession(
          invalidQueueId,
        ),
      ).rejects.toThrow(new QueueNotFoundException(invalidQueueId));
    });

    it('should return empty array if there is no previous active session withing date range', async () => {
      const queueId = queues[0].id;
      const userId = users[0].id;

      // Mock current time to be within working hours
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId,
          1,
        );

      expect(queuedUserEntry).toBeDefined();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prismaService.queuedUser.update({
        where: {
          id: queuedUserEntry.id,
        },
        data: {
          createdAt: yesterday,
        },
      });

      const queuedUserResponse =
        await queuedUserServiceservice.getQueuedUsersForQueueActiveSession(
          queueId,
        );

      expect(queuedUserResponse.length).toBe(0);
    });

    it('should return list of two entries if there is two actives session withing 4 total entries', async () => {
      const queueId = queues[0].id;
      const userId1 = users[0].id;
      const userId2 = users[1].id;
      const userId3 = users[2].id;
      const userId4 = users[3].id;

      const oldQueuedUserEntry1 =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId1,
          1,
        );

      const oldQueuedUserEntry2 =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId2,
          1,
        );

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prismaService.queuedUser.update({
        where: {
          id: oldQueuedUserEntry1.id,
        },
        data: {
          createdAt: yesterday,
        },
      });

      await prismaService.queuedUser.update({
        where: {
          id: oldQueuedUserEntry2.id,
        },
        data: {
          createdAt: yesterday,
        },
      });

      expect(oldQueuedUserEntry1).toBeDefined();
      expect(oldQueuedUserEntry2).toBeDefined();

      // Mock current date to be the composedDate
      // jest.spyOn(global, 'Date').mockImplementation(() => today);
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

      const queuedUserEntry1 =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId3,
          1,
        );

      const queuedUserEntry2 =
        await queuedUserServiceservice.createQueuedUserEntry(
          queueId,
          userId4,
          1,
        );

      const queuedUserResponse =
        await queuedUserServiceservice.getQueuedUsersForQueueActiveSession(
          queueId,
        );

      expect(queuedUserResponse.length).toBe(2);
      expect(queuedUserResponse[0].id).toBe(queuedUserEntry1.id);
      expect(queuedUserResponse[0].userId).toBe(userId3);
      expect(queuedUserResponse[1].id).toBe(queuedUserEntry2.id);
      expect(queuedUserResponse[1].userId).toBe(userId4);
    });
  });

  // If last session is older and its already in time for a new session, the system should not return any entry, even if there is entries in the database, because they are from a old session
  it('should return an empty list if all entries are more than a full cycle old', async () => {
    const queueId = queues[0].id;
    const userId1 = users[0].id;
    const userId2 = users[1].id;
    const userId3 = users[2].id;
    const userId4 = users[3].id;

    const oldQueuedUserEntry1 =
      await queuedUserServiceservice.createQueuedUserEntry(queueId, userId1, 1);

    const oldQueuedUserEntry2 =
      await queuedUserServiceservice.createQueuedUserEntry(queueId, userId2, 1);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await prismaService.queuedUser.update({
      where: {
        id: oldQueuedUserEntry1.id,
      },
      data: {
        createdAt: twoDaysAgo,
      },
    });

    await prismaService.queuedUser.update({
      where: {
        id: oldQueuedUserEntry2.id,
      },
      data: {
        createdAt: twoDaysAgo,
      },
    });

    expect(oldQueuedUserEntry1).toBeDefined();
    expect(oldQueuedUserEntry2).toBeDefined();

    // Mock current date to be the composedDate
    // jest.spyOn(global, 'Date').mockImplementation(() => today);
    jest.spyOn(Date.prototype, 'getHours').mockReturnValue(18);
    jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);

    const queuedUserEntry1 =
      await queuedUserServiceservice.createQueuedUserEntry(queueId, userId3, 1);

    const queuedUserEntry2 =
      await queuedUserServiceservice.createQueuedUserEntry(queueId, userId4, 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    await prismaService.queuedUser.update({
      where: {
        id: queuedUserEntry1.id,
      },
      data: {
        createdAt: yesterday,
      },
    });

    await prismaService.queuedUser.update({
      where: {
        id: queuedUserEntry2.id,
      },
      data: {
        createdAt: yesterday,
      },
    });

    const queuedUserResponse =
      await queuedUserServiceservice.getQueuedUsersForQueueActiveSession(
        queueId,
      );

    expect(queuedUserResponse.length).toBe(0);
  });
});
