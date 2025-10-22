import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUnityDto, UnityDto } from './unity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  createUnityBadRequestExceptionMessages,
  updateUnityExceptionMessages,
  UnityNotFoundException,
  defaultUnityExceptionsMessages,
} from './unity.exceptions';
import { checkCreateUnityRequirementsOrThrowError } from './unity.utils';

interface GetAllUnitiesArgs {
  clientId: string;
}

interface UnityIdArg {
  unityId: string;
}

interface GetUnitiesByIdsArg {
  unitiesIds: string[];
}

export interface UpdateUnityArgs extends UnityIdArg {
  payload: Partial<Omit<CreateUnityDto, 'clientId'>>;
}

@Injectable()
export class UnityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   *  Create a new Unity for a Client in the database using the provided data.
   *
   * @param {CreateUnityDto} data  The data required to create a new unity.
   * @returns {Promise<UnityDto>} The created UnityDto object
   */
  async createUnity(data: CreateUnityDto): Promise<UnityDto> {
    checkCreateUnityRequirementsOrThrowError(data);

    const confirmedClient = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
      },
    });

    if (!confirmedClient) {
      throw new UnityNotFoundException(
        createUnityBadRequestExceptionMessages.CLIENT_NOT_FOUND,
      );
    }

    const newUnity = await this.prisma.unity.create({ data });

    return {
      ...newUnity,
      address: newUnity.address ?? undefined,
      phone: newUnity.phone ?? undefined,
      email: newUnity.email ?? undefined,
      createdAt: newUnity.createdAt,
    };
  }

  /**
   * Returns all UnityDto for a given Client
   *
   * @param {GetAllUnitiesArgs} data Client Id
   * @returns {Promise<Array<UnityDto>>} Returns a list of UnityDto
   */
  async getAllUnities(data: GetAllUnitiesArgs): Promise<Array<UnityDto>> {
    if (!data.clientId) {
      throw new BadRequestException(
        defaultUnityExceptionsMessages.CLIENT_ID_REQUIRED,
      );
    }

    const unityList = await this.prisma.unity.findMany({
      where: {
        clientId: data.clientId,
      },
    });

    const formattedUnities: UnityDto[] = unityList.map((unity) => ({
      ...unity,
      email: unity.email ?? undefined,
      address: unity.address ?? undefined,
      phone: unity.phone ?? undefined,
    }));

    return formattedUnities;
  }

  /**
   * Get Unity list data by its Ids
   *
   * @param {GetUnitiesByIdsArg} data The List of ids for Unities
   * @returns Return a List of UnityDto
   */
  async getUnitiesByIds(data: GetUnitiesByIdsArg): Promise<UnityDto[]> {
    if (data.unitiesIds.length <= 0) {
      throw new BadRequestException(
        defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
      );
    }

    const unitiesList = Promise.all(
      data.unitiesIds.map(async (unityId) => {
        const result = await this.prisma.unity.findFirst({
          where: {
            id: unityId,
          },
        });

        if (result) {
          return {
            ...result,
            address: result?.address ?? undefined,
            phone: result?.phone ?? undefined,
            email: result?.email ?? undefined,
          };
        }
      }),
    );

    const filteredUnityList = (await unitiesList).filter(
      (unity) => unity !== undefined,
    );

    return filteredUnityList;
  }

  /**
   * Disabled a Enabled Unity
   *
   * @param {UnityIdArg} data The Enabled Unity Id to be disabled
   * @returns {Promise<UnityDto>} The updated Unity object data
   */
  async disableUnity(data: UnityIdArg): Promise<UnityDto> {
    if (!data.unityId || data.unityId === '') {
      throw new BadRequestException(
        defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
      );
    }

    let unity = await this.prisma.unity.findFirst({
      where: {
        id: data.unityId,
      },
    });

    if (!unity) {
      throw new UnityNotFoundException(data.unityId);
    }

    if (!unity.enabled) {
      throw new Error(updateUnityExceptionMessages.UNITY_ALREADY_DISABLED);
    }

    unity = await this.prisma.unity.update({
      where: {
        id: unity.id,
      },
      data: {
        enabled: false,
      },
    });

    return {
      ...unity,
      address: unity.address ?? undefined,
      phone: unity.phone ?? undefined,
      email: unity.email ?? undefined,
    };
  }

  /**
   * Enable a Disabled Unity
   *
   * @param {UnityIdArg} data The Disabled Unity Id to be disabled
   * @returns {Promise<UnityDto>} The updated Unity object data
   */
  async enableUnity(data: UnityIdArg): Promise<UnityDto> {
    if (!data.unityId || data.unityId === '') {
      throw new BadRequestException(
        defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
      );
    }

    let unity = await this.prisma.unity.findFirst({
      where: {
        id: data.unityId,
      },
    });

    if (!unity) {
      throw new UnityNotFoundException(data.unityId);
    }

    if (unity.enabled) {
      throw new Error(updateUnityExceptionMessages.UNITY_ALREADY_ENABLED);
    }

    unity = await this.prisma.unity.update({
      where: {
        id: unity.id,
      },
      data: {
        enabled: true,
      },
    });

    return {
      ...unity,
      address: unity.address ?? undefined,
      phone: unity.phone ?? undefined,
      email: unity.email ?? undefined,
    };
  }

  /**
   * Updates data fpr a given Unity
   *
   * @param {UpdateUnityArgs} data The arguments to update unity
   * @returns {Promise<UnityDto>} UnityDto from the updated Unity
   */
  async updateUnity(data: UpdateUnityArgs): Promise<UnityDto> {
    if (!data.unityId) {
      throw new BadRequestException(
        defaultUnityExceptionsMessages.UNITY_ID_REQUIRED,
      );
    }

    if (!data.payload) {
      throw new BadRequestException(
        updateUnityExceptionMessages.PAYLOAD_REQUIRED,
      );
    }

    const itemsPayload = Object.keys(data.payload);

    if (itemsPayload.length <= 0) {
      throw new BadRequestException(
        updateUnityExceptionMessages.PAYLOAD_REQUIRED,
      );
    }

    const existingUnity = await this.prisma.unity.findFirst({
      where: {
        id: data.unityId,
      },
    });

    if (!existingUnity) {
      throw new UnityNotFoundException(data.unityId);
    }

    const unity = await this.prisma.unity.update({
      where: {
        id: data.unityId,
      },
      data: {
        ...data.payload,
      },
    });

    return {
      ...unity,
      address: unity.address ?? undefined,
      email: unity.email ?? undefined,
      phone: unity.phone ?? undefined,
    };
  }
}
