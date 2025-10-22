import { QueueService } from './queue.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { CreateQueueDto } from './queue.dto';
import { QueueType } from '@prisma/client';
import {
  CreateQueueBadRequestException,
  defaultQueueExceptionsMessage,
} from './queue.exceptions';
import { ClientNotFoundException } from 'src/client/client.exceptions';
import { UnityNotFoundException } from 'src/unity/unity.exceptions';

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

describe('QueueService', () => {
  let queueService: QueueService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;
  // let queue: QueueDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    queueService = module.get<QueueService>(QueueService);
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

    // const createQueueResponse = await prismaService.queue.create({
    //   data: {
    //     ...CREATE_QUEUE_MOCK_DATA[1],
    //     clientId: client.id,
    //     unityId: unity.id,
    //   },
    // });

    // Format response to QueueDto
    // queue = {
    //   ...createQueueResponse,
    //   name: createQueueResponse.name ?? undefined,
    //   minWaitingTimeInMinutes: undefined,
    //   maxWaitingTimeInMinutes: undefined,
    //   currentWaitingTimeInMinutes: undefined,
    //   adminId: undefined,
    //   UserQueue: [],
    // };
  });

  it('should be defined', () => {
    expect(queueService).toBeDefined();
  });

  describe('createQueue', () => {
    it('Should NOT create a Queue with missing Type', async () => {
      await expect(
        queueService.createQueue({
          ...CREATE_QUEUE_MOCK_DATA[1],
          type: undefined as unknown as QueueType, // Forcing wrong type assignment
          clientId: client.id,
          unityId: unity.id,
        }),
      ).rejects.toThrow(
        new CreateQueueBadRequestException(
          defaultQueueExceptionsMessage.TYPE_IS_REQUIRED,
        ),
      );
    });

    it('Should NOT create a Queue with missing Client Id', async () => {
      await expect(
        queueService.createQueue({
          ...CREATE_QUEUE_MOCK_DATA[1],
          clientId: '',
          unityId: unity.id,
        }),
      ).rejects.toThrow(
        new CreateQueueBadRequestException(
          defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
        ),
      );
    });

    it('Should NOT create a Queue with missing Unity Id', async () => {
      await expect(
        queueService.createQueue({
          ...CREATE_QUEUE_MOCK_DATA[1],
          clientId: client.id,
          unityId: '',
        }),
      ).rejects.toThrow(
        new CreateQueueBadRequestException(
          defaultQueueExceptionsMessage.UNITY_ID_REQUIRED,
        ),
      );
    });

    it('Should NOT create a Queue with invalid Client Id', async () => {
      const notExistingClientId = 'not_existing_client_id';
      await expect(
        queueService.createQueue({
          ...CREATE_QUEUE_MOCK_DATA[1],
          clientId: notExistingClientId,
          unityId: unity.id,
        }),
      ).rejects.toThrow(new ClientNotFoundException(notExistingClientId));
    });

    it('Should NOT create a Queue with invalid Unity Id', async () => {
      const notExistingUnityId = 'not_existing_unity_id';
      await expect(
        queueService.createQueue({
          ...CREATE_QUEUE_MOCK_DATA[1],
          clientId: client.id,
          unityId: notExistingUnityId,
        }),
      ).rejects.toThrow(new UnityNotFoundException(notExistingUnityId));
    });

    it('Should create a Queue', async () => {
      const queueResponse = await queueService.createQueue({
        ...CREATE_QUEUE_MOCK_DATA[1],
        clientId: client.id,
        unityId: unity.id,
      });

      expect(queueResponse.id).toBeDefined();
      expect(queueResponse.clientId).toBe(client.id);
      expect(queueResponse.unityId).toBe(unity.id);
    });
  });
});
