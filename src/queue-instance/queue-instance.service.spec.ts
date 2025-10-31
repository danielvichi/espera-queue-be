import { QueueInstanceService } from './queue-instance.service';
import { CreateQueueDto, QueueDto } from 'src/queue/queue.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { QueueType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { DateTime } from 'luxon';
import {
  defaultQueueInstanceExceptionsMessage,
  QueueInstanceNotFoundException,
  UserAlreadyInQueueException,
  UserNotFoundException,
} from './queue-instance.execeptions';
import { NotFoundException } from '@nestjs/common';
import { QueueUserDto } from 'src/queue-user/queue-user.dto';

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

describe('QueueInstanceService', () => {
  let queueInstanceService: QueueInstanceService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;
  let queueGeneral: QueueDto;
  let queuePriority: QueueDto;
  let queueUser: QueueUserDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueInstanceService =
      module.get<QueueInstanceService>(QueueInstanceService);
    prismaService = module.get<PrismaService>(PrismaService);
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

    queuePriority = await prismaService.queue.create({
      data: {
        ...CREATE_QUEUE_MOCK_DATA[1],
        clientId: client.id,
        unityId: unity.id,
      },
    });

    queueUser = await prismaService.queueUser.create({
      data: CREATE_QUEUE_USER_MOCK_DATA,
    });
  });

  it('should be defined', () => {
    expect(queueInstanceService).toBeDefined();
  });

  describe('addQueueInstance', () => {
    it('should thrown NotFoundException when queue does not exist', async () => {
      await expect(
        queueInstanceService.addQueueInstance('non-existing-queue-id'),
      ).rejects.toThrow(
        new NotFoundException(
          defaultQueueInstanceExceptionsMessage.QUEUE_NOT_FOUND,
        ),
      );
    });

    it('should create a new Queue Instance', async () => {
      const queueInstance = await queueInstanceService.addQueueInstance(
        queueGeneral.id,
      );

      expect(queueInstance).toBeDefined();
      expect(queueInstance.queueId).toBe(queueGeneral.id);
      expect(queueInstance.queueInstanceId).toBeDefined();
      expect(queueInstance.date).toBeDefined();
      expect(queueInstance.name).toBe(queueGeneral.name);
      expect(queueInstance.type).toBe(queueGeneral.type);
    });

    it('should throw error when a Queue Instance is already created for today', async () => {
      await queueInstanceService.addQueueInstance(queueGeneral.id);
      await expect(
        queueInstanceService.addQueueInstance(queueGeneral.id),
      ).rejects.toThrow(
        new Error(
          defaultQueueInstanceExceptionsMessage.QUEUE_INSTANCE_ALREADY_CREATED,
        ),
      );
    });

    it('should create a new Queue Instance for today for other Queue', async () => {
      const queueInstance = await queueInstanceService.addQueueInstance(
        queuePriority.id,
      );

      expect(queueInstance).toBeDefined();
      expect(queueInstance.queueId).toBe(queuePriority.id);
      expect(queueInstance.queueInstanceId).toBeDefined();
      expect(queueInstance.date).toBeDefined();
      expect(queueInstance.name).toBe(queuePriority.name);
      expect(queueInstance.type).toBe(queuePriority.type);
    });
  });

  describe('addUserToQueue', () => {
    it('should throw NotFoundException when queue instance does not exist', async () => {
      const nonExistingQueueInstanceId = 'non-existing-queue-instance-id';

      await expect(
        queueInstanceService.addUserToQueue({
          queueInstanceId: nonExistingQueueInstanceId,
          userId: 'some-user-id',
        }),
      ).rejects.toThrow(
        new QueueInstanceNotFoundException(nonExistingQueueInstanceId),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const nonExistingUserId = 'non-existing-user-id';

      // First, create a queue instance
      const queueInstance = await queueInstanceService.addQueueInstance(
        queueGeneral.id,
      );

      await expect(
        queueInstanceService.addUserToQueue({
          queueInstanceId: queueInstance.queueInstanceId,
          userId: nonExistingUserId,
        }),
      ).rejects.toThrow(new UserNotFoundException(nonExistingUserId));
    });

    it('should add user to queue instance', async () => {
      const queueInstance = await queueInstanceService.addQueueInstance(
        queueGeneral.id,
      );

      const updatedUsersInQueue = await queueInstanceService.addUserToQueue({
        queueInstanceId: queueInstance.queueInstanceId,
        userId: queueUser.id,
      });

      expect(updatedUsersInQueue).toContain(queueUser.id);
    });

    it('should throw UserAlreadyInQueueException when user is already in queue', async () => {
      const queueInstance = await queueInstanceService.addQueueInstance(
        queueGeneral.id,
      );

      await queueInstanceService.addUserToQueue({
        queueInstanceId: queueInstance.queueInstanceId,
        userId: queueUser.id,
      });
      await expect(
        queueInstanceService.addUserToQueue({
          queueInstanceId: queueInstance.queueInstanceId,
          userId: queueUser.id,
        }),
      ).rejects.toThrow(
        new UserAlreadyInQueueException({
          queueInstanceId: queueInstance.queueInstanceId,
          userId: queueUser.id,
        }),
      );
    });

    // it('should throw UserAlreadyInQueueException when user is already in another queue from the same unity at the same day', async () => {
    it('should add user even if there is a queue instance for previous day with the user in the queue', async () => {
      const yesterdayQueueInstance =
        await queueInstanceService.addQueueInstance(queueGeneral.id);

      const twentyFourHoursInMs = 60000 * 60 * 24 + 1000;
      const yesterday = DateTime.now().minus(twentyFourHoursInMs);

      // Updated queue instance record for past day with user in the Queue Instance for previous day
      await prismaService.queueInstance.update({
        where: {
          id: yesterdayQueueInstance.queueInstanceId,
        },
        data: {
          createdAt: yesterday.toJSDate(),
          date: yesterday.toJSDate(),
          usersInQueue: [queueUser.id],
        },
      });

      const todayQueueInstance = await queueInstanceService.addQueueInstance(
        queueGeneral.id,
      );

      await queueInstanceService.addUserToQueue({
        queueInstanceId: todayQueueInstance.queueInstanceId,
        userId: queueUser.id,
      });

      const response = await queueInstanceService.addUserToQueue({
        queueInstanceId: todayQueueInstance.queueInstanceId,
        userId: queueUser.id,
      });

      expect(response.includes(queueUser.id)).toBe(true);
    });

    it('should throw UserAlreadyInQueueException when user is already in another queue from the same unity at the same day', async () => {
      const priorityQueueInstance = await queueInstanceService.addQueueInstance(
        queuePriority.id,
      );

      // Adding user to Priority Queue Instance
      await prismaService.queueInstance.update({
        where: {
          id: priorityQueueInstance.queueInstanceId,
        },
        data: {
          usersInQueue: [queueUser.id],
        },
      });

      const generalQueueInstance = await queueInstanceService.addQueueInstance(
        queueGeneral.id,
      );

      await expect(
        queueInstanceService.addUserToQueue({
          queueInstanceId: generalQueueInstance.queueInstanceId,
          userId: queueUser.id,
        }),
      ).rejects.toThrow(
        new UserAlreadyInQueueException({
          queueInstanceId: generalQueueInstance.queueInstanceId,
          userId: queueUser.id,
        }),
      );
    });
  });
});
