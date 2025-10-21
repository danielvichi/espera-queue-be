import { Injectable } from '@nestjs/common';
import { CreateUnityDto, UnityDto } from './unity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateUnityBadRequestException,
  createUnityBadRequestExceptionMessages,
  UnityNotFoundException,
} from './unity.exceptions';

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
    if (!data.name) {
      throw new CreateUnityBadRequestException(
        createUnityBadRequestExceptionMessages.NAME_REQUIRED,
      );
    }

    if (!data.clientId) {
      throw new CreateUnityBadRequestException(
        createUnityBadRequestExceptionMessages.CLIENT_ID_REQUIRED,
      );
    }

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
}
