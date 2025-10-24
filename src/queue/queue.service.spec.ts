import { QueueService } from './queue.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { CreateUnityDto, UnityDto } from 'src/unity/unity.dto';
import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { CreateQueueDto, QueueDto } from './queue.dto';
import { QueueType } from '@prisma/client';
import {
  CreateQueueBadRequestException,
  defaultQueueExceptionsMessage,
} from './queue.exceptions';
import { ClientNotFoundException } from 'src/client/client.exceptions';
import { UnityNotFoundException } from 'src/unity/unity.exceptions';
import { BadRequestException, NotFoundException } from '@nestjs/common';

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
  const queues: QueueDto[] = [];

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

    for (let i = 0; i < 2; i++) {
      const createQueueResponse = await prismaService.queue.create({
        data: {
          ...CREATE_QUEUE_MOCK_DATA[i + 1],
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

    describe('getQueuesByIds', () => {
      it('Should NOT be able to retrieve Queue data with proper Queue Id ', async () => {
        await expect(
          queueService.getQueuesByIds({
            queueIds: [],
            clientId: client.id,
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
          ),
        );
      });
      it('Should return a list of 2 Queues by its Ids ', async () => {
        const queueIds = queues.map((queue) => queue.id);
        const queueResponse = await queueService.getQueuesByIds({
          queueIds: queueIds,
          clientId: client.id,
        });

        expect(queueResponse.length).toBe(2);
        expect(queueResponse[0].id).toBe(queueIds[0]);
        expect(queueResponse[1].id).toBe(queueIds[1]);
      });
    });

    describe('updateQueue', () => {
      it('Should NOT updated a Queue with missing queueId', async () => {
        await expect(
          queueService.updateQueue({
            queueId: '',
            clientId: client.id,
            payload: {
              name: 'new name',
            },
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
          ),
        );
      });

      it('Should NOT updated a Queue with missing clientId', async () => {
        await expect(
          queueService.updateQueue({
            queueId: queues[0].id,
            clientId: '',
            payload: {
              name: 'new name',
            },
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
          ),
        );
      });

      it('Should NOT updated a Queue with missing payload', async () => {
        await expect(
          queueService.updateQueue({
            queueId: queues[0].id,
            clientId: client.id,
            payload: {},
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.PAYLOAD_REQUIRED,
          ),
        );
      });

      it('Should NOT updated a Queue with invalid Queue Id', async () => {
        await expect(
          queueService.updateQueue({
            queueId: 'invalid_queue_id',
            clientId: client.id,
            payload: {
              name: 'new name',
            },
          }),
        ).rejects.toThrow(
          new NotFoundException(defaultQueueExceptionsMessage.QUEUE_NOT_FOUND),
        );
      });

      it('Should NOT updated a Queue with invalid Client Id', async () => {
        await expect(
          queueService.updateQueue({
            queueId: queues[0].id,
            clientId: 'invalid_client_id',
            payload: {
              name: 'new name',
            },
          }),
        ).rejects.toThrow(
          new NotFoundException(defaultQueueExceptionsMessage.QUEUE_NOT_FOUND),
        );
      });

      it('Should updated a Queue', async () => {
        const payload: Partial<CreateQueueDto> = {
          name: 'new name 2',
        };

        const queueResponse = await queueService.updateQueue({
          queueId: queues[0].id,
          clientId: client.id,
          payload: payload,
        });

        expect(queueResponse.name).toBe(payload.name);
      });
    });

    describe('disableQueue', () => {
      it('Should NOT disable a Queue with missing queueId', async () => {
        await expect(
          queueService.disableQueue({
            queueId: '',
            clientId: client.id,
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
          ),
        );
      });

      it('Should NOT disable a Queue with missing clientId', async () => {
        await expect(
          queueService.disableQueue({
            queueId: queues[0].id,
            clientId: '',
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
          ),
        );
      });

      it('Should disable a enabled Queue', async () => {
        const disabledQueue = await queueService.disableQueue({
          queueId: queues[0].id,
          clientId: client.id,
        });

        expect(disabledQueue.id).toBe(queues[0].id);
        expect(disabledQueue.enabled).toBe(false);
      });

      it('Should NOT disable a Queue if its already disabled', async () => {
        await expect(
          queueService.disableQueue({
            queueId: queues[0].id,
            clientId: client.id,
          }),
        ).rejects.toThrow(
          new NotFoundException(defaultQueueExceptionsMessage.QUEUE_NOT_FOUND),
        );
      });
    });

    describe('enableQueue', () => {
      it('Should NOT enable a Queue with missing queueId', async () => {
        await expect(
          queueService.enableQueue({
            queueId: '',
            clientId: client.id,
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.QUEUE_ID_REQUIRED,
          ),
        );
      });

      it('Should NOT enable a Queue with missing clientId', async () => {
        await expect(
          queueService.enableQueue({
            queueId: queues[0].id,
            clientId: '',
          }),
        ).rejects.toThrow(
          new BadRequestException(
            defaultQueueExceptionsMessage.CLIENT_ID_REQUIRED,
          ),
        );
      });

      it('Should enable a disabled Queue ', async () => {
        const queueIdToDisabled = queues[0].id;

        let disabledQueue = await queueService.getQueuesByIds({
          queueIds: [queueIdToDisabled],
          clientId: client.id,
        });

        if (disabledQueue[0].enabled) {
          disabledQueue = [
            await queueService.disableQueue({
              queueId: queueIdToDisabled,
              clientId: client.id,
            }),
          ];
        }

        expect(disabledQueue[0]).toBeDefined();
        expect(disabledQueue[0].enabled).toBe(false);

        const enabledQueue = await queueService.enableQueue({
          queueId: queueIdToDisabled,
          clientId: client.id,
        });

        expect(enabledQueue.id).toBe(queueIdToDisabled);
        expect(enabledQueue.enabled).toBe(true);
      });

      it('Should NOT disable a Queue if its already disabled', async () => {
        await expect(
          queueService.enableQueue({
            queueId: queues[0].id,
            clientId: client.id,
          }),
        ).rejects.toThrow(
          new NotFoundException(defaultQueueExceptionsMessage.QUEUE_NOT_FOUND),
        );
      });
    });
  });
});
