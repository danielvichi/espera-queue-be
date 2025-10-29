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
import { defaultQueueInstanceExceptionsMessage } from './queue-instance.execeptions';
import { NotFoundException } from '@nestjs/common';

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

describe('QueueInstanceService', () => {
  let queueInstanceService: QueueInstanceService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;
  let queueGeneral: QueueDto;
  let queuePriority: QueueDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueInstanceService =
      module.get<QueueInstanceService>(QueueInstanceService);
    prismaService = module.get<PrismaService>(PrismaService);

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
});
