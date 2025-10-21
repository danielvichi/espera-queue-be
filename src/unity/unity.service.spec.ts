import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { UnityService } from './unity.service';
import {
  CreateUnityBadRequestException,
  createUnityBadRequestExceptionMessages,
  updateUnityExceptionMessages,
  UnityNotFoundException,
} from './unity.exceptions';
import { CreateUnityDto } from './unity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { BadRequestException } from '@nestjs/common';

const CREATE_UNITY_MOCK_DATA: Omit<CreateUnityDto, 'clientId'> = {
  name: 'Unity Name',
  address: 'some address',
};

const CREATE_CLIENT_MOCK_DATA: CreateClientDto = {
  name: 'Client Test',
};

describe('UnityService', () => {
  let unityService: UnityService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;

  beforeAll(async () => {
    const module = await TestModuleSingleton.createTestModule();
    unityService = module.get<UnityService>(UnityService);
    prismaService = module.get<PrismaService>(PrismaService);

    await TestModuleSingleton.cleanUpDatabase();

    const createClientResponse = await prismaService.client.create({
      data: CREATE_CLIENT_MOCK_DATA,
    });

    client = {
      ...createClientResponse,
      phone: undefined,
      address: undefined,
      ownerId: undefined,
    };
  });

  it('should be defined', () => {
    expect(unityService).toBeDefined();
  });

  describe('createUnity', () => {
    it('should NOT be able to create a Unity with missing name', async () => {
      await expect(
        unityService.createUnity({
          ...CREATE_UNITY_MOCK_DATA,
          name: '',
          clientId: 'id',
        }),
      ).rejects.toThrow(
        new CreateUnityBadRequestException(
          createUnityBadRequestExceptionMessages.NAME_REQUIRED,
        ),
      );
    });

    it('should NOT be able to create a Unity with missing clientId', async () => {
      await expect(
        unityService.createUnity({
          ...CREATE_UNITY_MOCK_DATA,
          clientId: '',
        }),
      ).rejects.toThrow(
        new CreateUnityBadRequestException(
          createUnityBadRequestExceptionMessages.CLIENT_ID_REQUIRED,
        ),
      );
    });

    it('should NOT be able to create a Unity with clientId of invalid Client', async () => {
      await expect(
        unityService.createUnity({
          ...CREATE_UNITY_MOCK_DATA,
          clientId: 'client_id_from_invalid_client',
        }),
      ).rejects.toThrow(
        new UnityNotFoundException(
          createUnityBadRequestExceptionMessages.CLIENT_NOT_FOUND,
        ),
      );
    });

    it('should create a Unity with proper data', async () => {
      const unity = await unityService.createUnity({
        ...CREATE_UNITY_MOCK_DATA,
        clientId: client.id,
      });

      expect(unity.id).toBeTruthy();
      expect(unity.name).toBe(CREATE_UNITY_MOCK_DATA.name);
      expect(unity.clientId).toBe(client.id);
      expect(unity.enabled).toBe(true);
    });
  });

  describe('disableUnity', () => {
    it('should NOT be able to disable a Unity without a valid Unity Id', async () => {
      await expect(
        unityService.disableUnity({
          unityId: '',
        }),
      ).rejects.toThrow(
        new BadRequestException(updateUnityExceptionMessages.UNITY_ID_REQUIRED),
      );
    });

    it('should NOT be able to disable a not founded Unity', async () => {
      const invalidUnityId = 'not_existing_id';

      await expect(
        unityService.disableUnity({
          unityId: invalidUnityId,
        }),
      ).rejects.toThrow(new UnityNotFoundException(invalidUnityId));
    });

    it('should be able to disable an enabled existing Unity', async () => {
      const existingUnity = await prismaService.unity.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!existingUnity) {
        throw new Error('No Unity founded');
      }

      const disabledUnity = await unityService.disableUnity({
        unityId: existingUnity?.id,
      });

      expect(disabledUnity.enabled).toBe(false);
    });

    it('should NOT be able to disable an already disabled Unity', async () => {
      const existingUnity = await prismaService.unity.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!existingUnity) {
        throw new Error('No Unity founded');
      }

      await expect(
        unityService.disableUnity({
          unityId: existingUnity?.id,
        }),
      ).rejects.toThrow(
        new Error(updateUnityExceptionMessages.UNITY_ALREADY_DISABLED),
      );
    });
  });

  describe('enableUnity', () => {
    it('should NOT be able to enable a Unity without a valid Unity Id', async () => {
      await expect(
        unityService.enableUnity({
          unityId: '',
        }),
      ).rejects.toThrow(
        new BadRequestException(updateUnityExceptionMessages.UNITY_ID_REQUIRED),
      );
    });

    it('should NOT be able to enable a not founded Unity', async () => {
      const invalidUnityId = 'not_existing_id';

      await expect(
        unityService.enableUnity({
          unityId: invalidUnityId,
        }),
      ).rejects.toThrow(new UnityNotFoundException(invalidUnityId));
    });

    it('should be able to enable an disabled existing Unity', async () => {
      const existingUnity = await prismaService.unity.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!existingUnity) {
        throw new Error('No Unity founded');
      }

      const disabledUnity = await unityService.enableUnity({
        unityId: existingUnity?.id,
      });

      expect(disabledUnity.enabled).toBe(true);
    });

    it('should NOT be able to enable an already enabled Unity', async () => {
      const existingUnity = await prismaService.unity.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!existingUnity) {
        throw new Error('No Unity founded');
      }

      await expect(
        unityService.enableUnity({
          unityId: existingUnity?.id,
        }),
      ).rejects.toThrow(
        new Error(updateUnityExceptionMessages.UNITY_ALREADY_ENABLED),
      );
    });

    describe('updateUnity', () => {
      it('should NOT be able to updated Unity data without a valid Unity Id', async () => {
        await expect(
          unityService.updateUnity({
            unityId: '',
            payload: {
              address: 'random address',
            },
          }),
        ).rejects.toThrow(
          new BadRequestException(
            updateUnityExceptionMessages.UNITY_ID_REQUIRED,
          ),
        );
      });
    });

    it('should NOT be able to updated a not founded Unity', async () => {
      const invalidUnityId = 'not_existing_id';

      await expect(
        unityService.updateUnity({
          unityId: invalidUnityId,
          payload: {
            address: 'random address',
          },
        }),
      ).rejects.toThrow(new UnityNotFoundException(invalidUnityId));
    });

    it('should NOT be able to update without valid payload', async () => {
      const existingUnity = await prismaService.unity.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!existingUnity) {
        throw new Error('No Unity founded');
      }

      await expect(
        unityService.updateUnity({
          unityId: existingUnity.id,
          payload: {},
        }),
      ).rejects.toThrow(
        new BadRequestException(updateUnityExceptionMessages.PAYLOAD_REQUIRED),
      );
    });

    it('should be able to update Unity', async () => {
      const newAddress = 'New random address';

      const existingUnity = await prismaService.unity.findFirst({
        where: {
          clientId: client.id,
        },
      });

      if (!existingUnity) {
        throw new Error('No Unity founded');
      }

      const unity = await unityService.updateUnity({
        unityId: existingUnity.id,
        payload: {
          address: newAddress,
        },
      });

      expect(unity.address).toBe(newAddress);
    });
  });
});
