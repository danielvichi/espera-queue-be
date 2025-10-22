import { TestModuleSingleton } from 'test/util/testModuleSingleTon';
import { UnityService } from './unity.service';
import {
  CreateUnityBadRequestException,
  createUnityBadRequestExceptionMessages,
  updateUnityExceptionMessages,
  UnityNotFoundException,
  defaultUnityExceptionsMessages,
} from './unity.exceptions';
import { CreateUnityDto, UnityDto } from './unity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateClientDto,
  CreateClientResponseDto,
} from 'src/client/client.dto';
import { BadRequestException } from '@nestjs/common';

const CREATE_UNITY_MOCK_DATA: Array<Omit<CreateUnityDto, 'clientId'>> = [
  {
    name: 'Unity Name',
    address: 'some address',
  },
  {
    name: 'Unity Name 2',
    address: 'some address',
  },
];

const CREATE_CLIENT_MOCK_DATA: CreateClientDto = {
  name: 'Client Test',
};

describe('UnityService', () => {
  let unityService: UnityService;
  let prismaService: PrismaService;

  let client: CreateClientResponseDto;
  let unity: UnityDto;

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

    const createUnityResponse = await prismaService.unity.create({
      data: {
        ...CREATE_UNITY_MOCK_DATA[0],
        clientId: client.id,
      },
    });

    unity = {
      ...createUnityResponse,
      address: createUnityResponse.address ?? undefined,
      email: undefined,
      phone: undefined,
    };
  });

  it('should be defined', () => {
    expect(unityService).toBeDefined();
  });

  describe('createUnity', () => {
    it('should NOT be able to create a Unity with missing name', async () => {
      await expect(
        unityService.createUnity({
          ...CREATE_UNITY_MOCK_DATA[1],
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
          ...CREATE_UNITY_MOCK_DATA[1],
          clientId: '',
        }),
      ).rejects.toThrow(
        new CreateUnityBadRequestException(
          defaultUnityExceptionsMessages.CLIENT_ID_REQUIRED,
        ),
      );
    });

    it('should NOT be able to create a Unity with clientId of invalid Client', async () => {
      await expect(
        unityService.createUnity({
          ...CREATE_UNITY_MOCK_DATA[1],
          clientId: 'client_id_from_invalid_client',
        }),
      ).rejects.toThrow(
        new UnityNotFoundException(
          createUnityBadRequestExceptionMessages.CLIENT_NOT_FOUND,
        ),
      );
    });

    it('should create a Unity with proper data', async () => {
      const createUnityData = CREATE_UNITY_MOCK_DATA[1];

      const unity = await unityService.createUnity({
        ...createUnityData,
        clientId: client.id,
      });

      expect(unity.id).toBeTruthy();
      expect(unity.name).toBe(createUnityData.name);
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
        new BadRequestException(
          defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
        ),
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
      await expect(
        unityService.disableUnity({
          unityId: unity.id,
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
        new BadRequestException(
          defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
        ),
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
      const disabledUnity = await unityService.enableUnity({
        unityId: unity?.id,
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
            defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
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

  describe('getAllUnities', () => {
    it('should NOT return not data with missing clientId', async () => {
      await expect(
        unityService.getAllUnities({
          clientId: '',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          defaultUnityExceptionsMessages.CLIENT_ID_REQUIRED,
        ),
      );
    });

    it('should return a list of UnityDto for a given clientId', async () => {
      const unityList = await unityService.getAllUnities({
        clientId: client.id,
      });

      expect(unityList.length).toBe(2);
    });
  });

  describe('getUnityById', () => {
    it('should NOT return not data with missing unity Id', async () => {
      await expect(
        unityService.getUnitiesByIds({
          unitiesIds: [],
        }),
      ).rejects.toThrow(
        new BadRequestException(
          defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
        ),
      );
    });

    it('should return the UnityDto for a given Unity Id', async () => {
      const response = await unityService.getUnitiesByIds({
        unitiesIds: [unity?.id],
      });

      expect(response[0].id).toBe(unity?.id);
    });
  });
});
